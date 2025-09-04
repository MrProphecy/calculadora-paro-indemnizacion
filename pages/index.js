import { useState, useMemo } from "react";

export default function Home(){
  const [form, setForm] = useState({
    salarioMensualBruto: "",
    anios: "",
    meses: "",
    tipoDespido: "improcedente",
    pre2012: { anios: "", meses: "" },
    baseReguladoraMensual: "",
    diasCotizados: "",
    hijos: 0,
    irpf: 2,
    cotizacion: 4.7
  });
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);

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
        body: JSON.stringify({ ...form, hijos: Number(form.hijos) })
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
      ["Salario mensual bruto", form.salarioMensualBruto],
      ["Antigüedad (años)", form.anios],
      ["Antigüedad (meses)", form.meses],
      ["Tipo de despido", form.tipoDespido],
      ["Hijos a cargo", form.hijos],
      ["Base reguladora mensual", form.baseReguladoraMensual],
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
        <h1 className="h1">Calculadora Paro + Indemnización (España)</h1>
        <p className="sub">Cálculo <span className="badge">estimativo</span> para 2025 (IPREM 600 €/mes con 1/6). No sustituye asesoramiento profesional.</p>

        <form onSubmit={onSubmit} className="grid" style={{gap:16}}>
          <div className="grid" style={{gridTemplateColumns: "repeat(12, 1fr)", gap: 16}}>
            <div style={{gridColumn: "span 5"}}>
              <div className="label">
                <span className="tooltip">Salario bruto mensual (€) <span className="tip">Con pagas prorrateadas. Úsalo también como aprox. de base reguladora si no la conoces.</span></span>
              </div>
              <input className="input" type="number" name="salarioMensualBruto" value={form.salarioMensualBruto} onChange={onChange} placeholder="Ej: 2200" required/>
            </div>
            <div style={{gridColumn: "span 2"}}>
              <div className="label"><span className="tooltip">Antigüedad (años)<span className="tip">Años completos trabajados en la empresa.</span></span></div>
              <input className="input" type="number" name="anios" value={form.anios} onChange={onChange} placeholder="Ej: 4" required/>
            </div>
            <div style={{gridColumn: "span 2"}}>
              <div className="label"><span className="tooltip">Antigüedad (meses)<span className="tip">Meses adicionales a los años completos.</span></span></div>
              <input className="input" type="number" name="meses" value={form.meses} onChange={onChange} placeholder="Ej: 6"/>
            </div>
            <div style={{gridColumn: "span 3"}}>
              <div className="label"><span className="tooltip">Hijos a cargo<span className="tip">Afecta a los mínimos y máximos del paro (IPREM).</span></span></div>
              <select name="hijos" className="input" value={form.hijos} onChange={onChange}>
                <option value={0}>0</option>
                <option value={1}>1</option>
                <option value={2}>2 o más</option>
              </select>
            </div>
          </div>

          <div className="grid" style={{gridTemplateColumns:"repeat(12, 1fr)", gap:16}}>
            <div style={{gridColumn:"span 5"}}>
              <div className="label"><span className="tooltip">Tipo de despido<span className="tip">Improcedente (33 d/año), Objetivo (20 d/año), Fin de contrato (12 d/año), o Baja (0 €).</span></span></div>
              <select name="tipoDespido" className="input" value={form.tipoDespido} onChange={onChange}>
                <option value="improcedente">Improcedente</option>
                <option value="objetivo">Objetivo</option>
                <option value="fin-contrato">Fin de contrato</option>
                <option value="baja">Baja voluntaria</option>
              </select>
            </div>

            <details style={{gridColumn:"span 7"}}>
              <summary>Opciones avanzadas</summary>
              <div className="row" style={{marginTop:12}}>
                <div>
                  <div className="label">Años <strong>antes</strong> del 12/02/2012</div>
                  <input className="input" type="number" name="pre2012.anios" value={form.pre2012.anios} onChange={onChange} placeholder="Ej: 2"/>
                </div>
                <div>
                  <div className="label">Meses <strong>antes</strong> del 12/02/2012</div>
                  <input className="input" type="number" name="pre2012.meses" value={form.pre2012.meses} onChange={onChange} placeholder="Ej: 3"/>
                </div>
              </div>
              <div className="row" style={{marginTop:12}}>
                <div>
                  <div className="label"><span className="tooltip">Base reguladora mensual (€)<span className="tip">Media de las bases de cotización de los últimos 180 días. Si no la sabes, usa el salario bruto mensual.</span></span></div>
                  <input className="input" type="number" name="baseReguladoraMensual" value={form.baseReguladoraMensual} onChange={onChange} placeholder="Ej: 2200" required/>
                </div>
                <div>
                  <div className="label"><span className="tooltip">Días cotizados (6 años)<span className="tip">Debe ser ≥ 360 para tener derecho a prestación. Determina la duración total.</span></span></div>
                  <input className="input" type="number" name="diasCotizados" value={form.diasCotizados} onChange={onChange} placeholder="Ej: 1320" required/>
                </div>
              </div>
              <div className="row" style={{marginTop:12}}>
                <div>
                  <div className="label"><span className="tooltip">IRPF (%)<span className="tip">Retención aproximada aplicada al paro. Personalízala según tu situación.</span></span></div>
                  <input className="input" type="number" step="0.1" name="irpf" value={form.irpf} onChange={onChange} />
                </div>
                <div>
                  <div className="label"><span className="tooltip">Cotización (%)<span className="tip">Cotización a la Seguridad Social sobre la prestación. Ajustable.</span></span></div>
                  <input className="input" type="number" step="0.1" name="cotizacion" value={form.cotizacion} onChange={onChange} />
                </div>
              </div>
            </details>
          </div>

          <div className="actions">
            <button className="btn" type="submit" disabled={loading}>{loading ? "Calculando..." : "Calcular"}</button>
            {resultado && !resultado.error && (
              <>
                <button type="button" className="btn secondary" onClick={()=>window.print()}>Imprimir / Guardar PDF</button>
                <button type="button" className="btn secondary" onClick={exportCSV}>Exportar CSV</button>
              </>
            )}
          </div>
        </form>

        {resultado && !resultado.error && (
          <div style={{marginTop:20}}>
            <div className="kpi">
              <div className="box">
                <div className="label">Indemnización estimada</div>
                <div style={{fontSize:28, fontWeight:800}}>{number(resultado.indemnizacion || 0)}</div>
                <div className="small">Topes: 24 mensualidades (improcedente); 12 (objetivo).</div>
              </div>
              <div className="box">
                <div className="label">Duración total del paro</div>
                <div style={{fontSize:28, fontWeight:800}}>{resultado.paro?.duracionDias || 0} días</div>
                <div className="small">Según días cotizados SEPE.</div>
              </div>
            </div>

            <div className="grid" style={{gridTemplateColumns:"repeat(12,1fr)", gap:16, marginTop:16}}>
              <div className="result" style={{gridColumn:"span 6"}}>
                <div className="label">Paro (primeros 180 días)</div>
                <div style={{fontSize:22, fontWeight:700}}>{number(resultado.paro?.importeTramo1 || 0)} /mes</div>
                {resultadoConNeto && <div className="small">Neto aprox: {number(resultadoConNeto.neto1)} /mes</div>}
                <div className="small">Meses: {resultado.paro?.mesesTramo1}</div>
              </div>
              <div className="result" style={{gridColumn:"span 6"}}>
                <div className="label">Paro (resto)</div>
                <div style={{fontSize:22, fontWeight:700}}>{number(resultado.paro?.importeTramo2 || 0)} /mes</div>
                {resultadoConNeto && <div className="small">Neto aprox: {number(resultadoConNeto.neto2)} /mes</div>}
                <div className="small">Meses: {resultado.paro?.mesesTramo2}</div>
              </div>
            </div>

            <div className="grid" style={{gridTemplateColumns:"repeat(12,1fr)", gap:16, marginTop:16}}>
              <div className="result" style={{gridColumn:"span 6"}}>
                <div className="label">Total estimado a percibir por paro (bruto)</div>
                <div style={{fontSize:22, fontWeight:700}}>{number(resultado.paro?.totalEstimado || 0)}</div>
              </div>
              <div className="result" style={{gridColumn:"span 6"}}>
                <div className="label">Total estimado a percibir por paro (neto aprox.)</div>
                <div style={{fontSize:22, fontWeight:700}}>{number(resultadoConNeto?.totalNeto || 0)}</div>
              </div>
            </div>

            <hr />
            <div className="notice">
              <ul>
                <li>IPREM mensual 600 € con incremento de 1/6 para mínimos y máximos.</li>
                <li>Prestación contributiva: 70% (primeros 180 días) y 60% el resto.</li>
                <li>Duración según días cotizados en los últimos 6 años.</li>
                <li>Los netos son una aproximación configurable con tus % de IRPF y cotización.</li>
                <li>Herramienta orientativa; contrasta en el simulador oficial del SEPE.</li>
              </ul>
            </div>
          </div>
        )}

        {resultado && resultado.error && (
          <div className="result" style={{marginTop:16}}>
            <div className="label">Error</div>
            <div>{resultado.detail || "Revisa los datos de entrada"}</div>
          </div>
        )}

        <div className="footer">
          Hecho con ❤️ para Viking | ExtractDataHub · Next.js en Vercel
        </div>
      </div>
    </div>
  );
}
