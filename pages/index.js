// --- BMC: botón simple reutilizable
function BuyCoffeeButton({
  label = "☕ Invítame un café",
  className = "",
}: { label?: string; className?: string }) {
  const id = process.env.NEXT_PUBLIC_BMC_ID || "vikingold";
  return (
    <a
      href={`https://www.buymeacoffee.com/${id}?utm_source=calc_paro`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center rounded-xl px-4 py-2 font-semibold text-white`}
      style={{ background: "#5F7FFF" }}
    >
      {label}
    </a>
  );
}
export default function Home(){
  // ...tu estado y lógica tal cual

  return (
    <div className="container">
      {/* BMC: widget flotante global */}
      <BuyCoffeeWidget />

      <div className="card">
        <h1 className="h1">Calculadora de Indemnización / Paro (España)</h1>

        {/* ...todo tu formulario y acciones... */}

        {/* RESULTADOS */}
        {resultado && !resultado.error && (
          <div style={{marginTop:18}}>
            {/* --- tus KPIs existentes --- */}
            <div className="kpi">
              <div className="box">
                <div className="label">Indemnización estimada</div>
                <div style={{fontSize:26, fontWeight:800}}>{number(resultado.indemnizacion || 0)}</div>
                <div className="small">Topes: 24 mensualidades (improcedente); 12 (objetivo).</div>
              </div>
              <div className="box">
                <div className="label">Duración total del paro</div>
                <div style={{fontSize:26, fontWeight:800}}>{resultado.paro?.duracionDias || 0} días</div>
                <div className="small">Según días cotizados SEPE.</div>
              </div>
            </div>

            {/* ...resto de tus bloques de resultado... */}

            {/* --- CTA Buy Me a Coffee (sólo con resultado) --- */}
            <div
              className="result"
              style={{
                marginTop:16,
                padding:16,
                borderRadius:12,
                border:"1px solid rgba(255,255,255,0.08)",
                background:"rgba(95,127,255,0.08)"
              }}
            >
              <div className="label" style={{marginBottom:8}}>
                ¿Te ayudó esta calculadora?
              </div>
              <p className="small" style={{opacity:0.85, marginBottom:12}}>
                Si te sirvió para estimar tu indemnización o la prestación, puedes apoyar el proyecto para que siga online y mejorando.
              </p>
              <BuyCoffeeButton />
            </div>
          </div>
        )}

        {resultado && resultado.error && (
          <div className="result" style={{marginTop:16}}>
            <div className="label">Error</div>
            <div>{resultado.detail || "Revisa los datos de entrada"}</div>
          </div>
        )}

        <div className="footer" style={{marginTop:16}}>
          El cálculo es reflejado según los datos actuales disponibles a fecha de 09/2025 ,aún así no sustituye asesoramiento profesional. | Viking V.1 - 2025 | ExtractDataHub · Next.js en Vercel
        </div>
      </div>
    </div>
  );
}

// --- BMC: widget flotante global (carga el script una vez)
import { useEffect } from "react";
function BuyCoffeeWidget() {
  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_BMC_ID || "vikingold";
    // evita duplicar
    if (document.querySelector('script[data-name="BMC-Widget"]')) return;

    const s = document.createElement("script");
    s.setAttribute("data-name", "BMC-Widget");
    s.src = "https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js";
    s.setAttribute("data-id", id);
    s.setAttribute("data-description", "Apoya el proyecto");
    s.setAttribute("data-message", "¿Te sirvió la calculadora? ¡Invítame un café!");
    s.setAttribute("data-color", "#5F7FFF");
    s.setAttribute("data-position", "Right");
    s.setAttribute("data-x_margin", "18");
    s.setAttribute("data-y_margin", "18");
    s.async = true;
    document.body.appendChild(s);
    return () => {
      // si esta página unmounta, limpia el script
      if (s && s.parentNode) s.parentNode.removeChild(s);
    };
  }, []);
  return null;
}
import { useMemo, useState } from "react";

export default function Home(){
  const [form, setForm] = useState({
    modoSalario: "mensual", // mensual | anual
    salarioMensualBruto: "",
    salarioAnualBruto: "",
    pagas: 14,
    tipoDespido: "improcedente",
    anios: "", meses: "",
    hijos: 0,
    pre2012: { anios: "", meses: "" },
    baseReguladoraMensual: "",
    diasCotizados: "",
    irpf: 2,
    cotizacion: 4.7
  });
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);

  const salarioMensualCalculado = useMemo(()=>{
    if(form.modoSalario === "mensual") return Number(form.salarioMensualBruto || 0);
    const anual = Number(form.salarioAnualBruto || 0);
    const pagas = Number(form.pagas || 12);
    return pagas > 0 ? anual / pagas : 0;
  }, [form.modoSalario, form.salarioMensualBruto, form.salarioAnualBruto, form.pagas]);

  const baseReguladoraAprox = useMemo(()=>{
    const b = Number(form.baseReguladoraMensual || 0);
    return b > 0 ? b : salarioMensualCalculado;
  }, [form.baseReguladoraMensual, salarioMensualCalculado]);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("pre2012.")){
      const key = name.split(".")[1];
      setForm(prev => ({...prev, pre2012: {...prev.pre2012, [key]: value}}));
    } else {
      setForm(prev => ({...prev, [name]: value}));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try{
      const res = await fetch("/api/calcular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salarioMensualBruto: salarioMensualCalculado,
          tipoDespido: form.tipoDespido,
          anios: form.anios, meses: form.meses,
          pre2012: form.pre2012,
          baseReguladoraMensual: baseReguladoraAprox,
          diasCotizados: form.diasCotizados,
          hijos: Number(form.hijos || 0)
        })
      });
      const data = await res.json();
      setResultado(data);
    } finally{
      setLoading(false);
    }
  };

  const resultadoConNeto = useMemo(() => {
    if(!resultado || resultado.error) return null;
    const irpf = Number(form.irpf || 0) / 100;
    const cot = Number(form.cotizacion || 0) / 100;
    const factor = 1 - (irpf + cot);
    const neto1 = (resultado.paro?.importeTramo1 || 0) * factor;
    const neto2 = (resultado.paro?.importeTramo2 || 0) * factor;
    const totalNeto = (neto1 * (resultado.paro?.mesesTramo1 || 0)) + (neto2 * (resultado.paro?.mesesTramo2 || 0));
    return { neto1: round2(neto1), neto2: round2(neto2), totalNeto: round2(totalNeto) };
  }, [resultado, form.irpf, form.cotizacion]);

  const number = (v)=> new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(v||0);
  function round2(n){ return Math.round((n + Number.EPSILON) * 100) / 100; }

  const exportCSV = () => {
    if(!resultado) return;
    const rows = [
      ["Campo","Valor"],
      ["Modo salario", form.modoSalario],
      ["Salario mensual bruto (calculado)", salarioMensualCalculado],
      ["Salario anual bruto", form.salarioAnualBruto],
      ["Pagas", form.pagas],
      ["Tipo de despido", form.tipoDespido],
      ["Antigüedad (años)", form.anios],
      ["Antigüedad (meses)", form.meses],
      ["Hijos a cargo", form.hijos],
      ["Base reguladora mensual usada", baseReguladoraAprox],
      ["Días cotizados (6 años)", form.diasCotizados],
      ["IRPF %", form.irpf],
      ["Cotización %", form.cotizacion],
      ["Indemnización estimada", resultado.indemnizacion],
      ["Duración del paro (días)", resultado.paro?.duracionDias],
      ["Paro tramo1 (€/mes)", resultado.paro?.importeTramo1],
      ["Meses tramo1", resultado.paro?.mesesTramo1],
      ["Paro tramo2 (€/mes)", resultado.paro?.importeTramo2],
      ["Meses tramo2", resultado.paro?.mesesTramo2],
      ["Total paro bruto", resultado.paro?.totalEstimado],
      ["Paro neto tramo1 (€/mes)", resultadoConNeto?.neto1],
      ["Paro neto tramo2 (€/mes)", resultadoConNeto?.neto2],
      ["Total paro neto", resultadoConNeto?.totalNeto],
    ];
    const csv = rows.map(r => r.map(x => `"${(x??"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "calculo-paro-indemnizacion.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="h1">Calculadora de Indemnización / Paro (España)</h1>
        {/* BLOQUE 1: Salario + Tipo de despido */}
        <div className="section" style={{marginBottom:16}}>
          <div className="form-grid two">
            <div>
              <div className="label">Modo de salario</div>
              <select name="modoSalario" className="input" value={form.modoSalario} onChange={onChange}>
                <option value="mensual">Bruto mensual</option>
                <option value="anual">Bruto anual</option>
              </select>
            </div>
            <div>
              <div className="label"><span className="tooltip">Tipo de despido<span className="tip">Improcedente (33 d/año), Objetivo (20 d/año), Fin de contrato (12 d/año), o Baja (0 €).</span></span></div>
              <select name="tipoDespido" className="input" value={form.tipoDespido} onChange={onChange}>
                <option value="improcedente">Improcedente</option>
                <option value="objetivo">Objetivo</option>
                <option value="fin-contrato">Fin de contrato</option>
                <option value="baja">Baja voluntaria</option>
              </select>
            </div>
          </div>

          {form.modoSalario === "mensual" ? (
            <div className="form-grid two" style={{marginTop:12}}>
              <div>
                <div className="label">Salario bruto <strong>mensual</strong> (€)</div>
                <input className="input" type="number" name="salarioMensualBruto" value={form.salarioMensualBruto} onChange={onChange} placeholder="Ej: 2200" />
              </div>
              <div>
                <div className="label"><span className="tooltip">Pagas (12/14)<span className="tip">Solo informativo. Para cálculos usamos el salario mensual introducido.</span></span></div>
                <select name="pagas" className="input" value={form.pagas} onChange={onChange}>
                  <option value={12}>12</option>
                  <option value={14}>14</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="form-grid three" style={{marginTop:12}}>
              <div>
                <div className="label">Salario bruto <strong>anual</strong> (€)</div>
                <input className="input" type="number" name="salarioAnualBruto" value={form.salarioAnualBruto} onChange={onChange} placeholder="Ej: 30000" />
              </div>
              <div>
                <div className="label">Pagas</div>
                <select name="pagas" className="input" value={form.pagas} onChange={onChange}>
                  <option value={12}>12</option>
                  <option value={14}>14</option>
                </select>
              </div>
              <div>
                <div className="label">Mensual (calculado)</div>
                <input className="input" value={salarioMensualCalculado || ""} readOnly />
              </div>
            </div>
          )}
        </div>

        {/* BLOQUE 2: Antigüedad + Hijos */}
        <div className="section" style={{marginBottom:16}}>
          <div className="form-grid three">
            <div>
              <div className="label">Antigüedad (años)</div>
              <input className="input" type="number" name="anios" value={form.anios} onChange={onChange} placeholder="Ej: 4" />
            </div>
            <div>
              <div className="label">Antigüedad (meses)</div>
              <input className="input" type="number" name="meses" value={form.meses} onChange={onChange} placeholder="Ej: 6" />
            </div>
            <div>
              <div className="label">Hijos a cargo</div>
              <select name="hijos" className="input" value={form.hijos} onChange={onChange}>
                <option value={0}>0</option>
                <option value={1}>1</option>
                <option value={2}>2 o más</option>
              </select>
            </div>
          </div>
        </div>

        {/* BLOQUE 3: Avanzado */}
        <details className="section">
          <summary>Prestación por Desempleo :Para el cálculo aproximado de la prestación por desempleo se debe colocar la cantidad de días cotizados (máximo 6 años) </summary>
          <div className="form-grid two" style={{marginTop:12}}>
            <div>
              <div className="label">Años <strong>antes</strong> del 12/02/2012</div>
              <input className="input" type="number" name="pre2012.anios" value={form.pre2012.anios} onChange={onChange} placeholder="Ej: 2"/>
            </div>
            <div>
              <div className="label">Meses <strong>antes</strong> del 12/02/2012</div>
              <input className="input" type="number" name="pre2012.meses" value={form.pre2012.meses} onChange={onChange} placeholder="Ej: 3"/>
            </div>
          </div>
          <div className="form-grid two" style={{marginTop:12}}>
            <div>
              <div className="label"><span className="tooltip">Base reguladora mensual (€)<span className="tip">Si no la sabes, usamos el salario mensual (calculado).</span></span></div>
              <input className="input" type="number" name="baseReguladoraMensual" value={form.baseReguladoraMensual} onChange={onChange} placeholder={String(baseReguladoraAprox || "")}/>
            </div>
            <div>
              <div className="label"><span className="tooltip">Días cotizados (6 años)<span className="tip">≥ 360 para tener derecho a prestación.</span></span></div>
              <input className="input" type="number" name="diasCotizados" value={form.diasCotizados} onChange={onChange} placeholder="Ej: 1320"/>
            </div>
          </div>
          <div className="form-grid two" style={{marginTop:12}}>
            <div>
              <div className="label">IRPF (%)</div>
              <input className="input" type="number" step="0.1" name="irpf" value={form.irpf} onChange={onChange} />
            </div>
            <div>
              <div className="label">Cotización (%)</div>
              <input className="input" type="number" step="0.1" name="cotizacion" value={form.cotizacion} onChange={onChange} />
            </div>
          </div>
        </details>

        {/* ACCIONES */}
        <div className="actions" style={{marginTop:16}}>
          <button className="btn" onClick={onSubmit} disabled={loading}>{loading ? "Calculando..." : "Calcular"}</button>
          {resultado && !resultado.error && (
            <>
              <button type="button" className="btn secondary" onClick={()=>window.print()}>Imprimir / Guardar PDF</button>
              <button type="button" className="btn secondary" onClick={exportCSV}>Exportar CSV</button>
            </>
          )}
        </div>

        {/* RESULTADOS */}
        {resultado && !resultado.error && (
          <div style={{marginTop:18}}>
            <div className="kpi">
              <div className="box">
                <div className="label">Indemnización estimada</div>
                <div style={{fontSize:26, fontWeight:800}}>{number(resultado.indemnizacion || 0)}</div>
                <div className="small">Topes: 24 mensualidades (improcedente); 12 (objetivo).</div>
              </div>
              <div className="box">
                <div className="label">Duración total del paro</div>
                <div style={{fontSize:26, fontWeight:800}}>{resultado.paro?.duracionDias || 0} días</div>
                <div className="small">Según días cotizados SEPE.</div>
              </div>
            </div>

            <div className="form-grid two" style={{marginTop:12}}>
              <div className="result">
                <div className="label">Paro (primeros 180 días)</div>
                <div style={{fontSize:20, fontWeight:700}}>{number(resultado.paro?.importeTramo1 || 0)} /mes</div>
                <div className="small">Neto aprox: {number((resultadoConNeto?.neto1)||0)} /mes — Meses: {resultado.paro?.mesesTramo1}</div>
              </div>
              <div className="result">
                <div className="label">Paro (resto)</div>
                <div style={{fontSize:20, fontWeight:700}}>{number(resultado.paro?.importeTramo2 || 0)} /mes</div>
                <div className="small">Neto aprox: {number((resultadoConNeto?.neto2)||0)} /mes — Meses: {resultado.paro?.mesesTramo2}</div>
              </div>
            </div>

            <div className="form-grid two" style={{marginTop:12}}>
              <div className="result">
                <div className="label">Total estimado por paro (bruto)</div>
                <div style={{fontSize:20, fontWeight:700}}>{number(resultado.paro?.totalEstimado || 0)}</div>
              </div>
              <div className="result">
                <div className="label">Total estimado por paro (neto aprox.)</div>
                <div style={{fontSize:20, fontWeight:700}}>{number((resultadoConNeto?.totalNeto)||0)}</div>
              </div>
            </div>
          </div>
        )}

        {resultado && resultado.error && (
          <div className="result" style={{marginTop:16}}>
            <div className="label">Error</div>
            <div>{resultado.detail || "Revisa los datos de entrada"}</div>
          </div>
        )}

        <div className="footer" style={{marginTop:16}}>
          El cálculo es reflejado según los datos actuales disponibles a fecha de 09/2025 ,aún así no sustituye asesoramiento profesional. | Viking V.1 - 2025 | ExtractDataHub · Next.js en Vercel
        </div>
      </div>
    </div>
  );
}
