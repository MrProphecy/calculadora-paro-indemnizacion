import { useState } from "react";

export default function Home(){
  const [form, setForm] = useState({
    salarioMensualBruto: "",
    anios: "",
    meses: "",
    tipoDespido: "improcedente",
    pre2012: { anios: "", meses: "" },
    baseReguladoraMensual: "",
    diasCotizados: "",
    hijos: 0
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
        body: JSON.stringify({
          ...form,
          hijos: Number(form.hijos)
        })
      });
      const data = await res.json();
      setResultado(data);
    } finally{
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="h1">Calculadora Paro + Indemnización (España)</h1>
        <p className="sub">Cálculo <span className="badge">estimativo</span> para 2025 (IPREM 600 €/mes con 1/6). No sustituye asesoramiento profesional.</p>

        <form onSubmit={onSubmit} className="grid" style={{gap:16}}>
          <div className="grid" style={{gridTemplateColumns: "repeat(12, 1fr)", gap: 16}}>
            <div style={{gridColumn: "span 6"}}>
              <div className="label">Salario bruto mensual (€) <span className="small">(con pagas prorrateadas)</span></div>
              <input className="input" type="number" name="salarioMensualBruto" value={form.salarioMensualBruto} onChange={onChange} placeholder="Ej: 2200" required/>
            </div>
            <div style={{gridColumn: "span 3"}}>
              <div className="label">Antigüedad (años)</div>
              <input className="input" type="number" name="anios" value={form.anios} onChange={onChange} placeholder="Ej: 4" required/>
            </div>
            <div style={{gridColumn: "span 3"}}>
              <div className="label">Antigüedad (meses)</div>
              <input className="input" type="number" name="meses" value={form.meses} onChange={onChange} placeholder="Ej: 6"/>
            </div>

            <div style={{gridColumn: "span 6"}}>
              <div className="label">Tipo de despido</div>
              <select name="tipoDespido" className="input" value={form.tipoDespido} onChange={onChange}>
                <option value="improcedente">Improcedente</option>
                <option value="objetivo">Objetivo</option>
                <option value="fin-contrato">Fin de contrato</option>
                <option value="baja">Baja voluntaria</option>
              </select>
            </div>

            <div style={{gridColumn: "span 6"}}>
              <div className="label">Hijos a cargo</div>
              <select name="hijos" className="input" value={form.hijos} onChange={onChange}>
                <option value={0}>0</option>
                <option value={1}>1</option>
                <option value={2}>2 o más</option>
              </select>
            </div>
          </div>

          <details>
            <summary>Opciones avanzadas</summary>
            <div className="row" style={{marginTop:12}}>
              <div>
                <div className="label">Años <strong>antes</strong> del 12/02/2012 (solo si aplica)</div>
                <input className="input" type="number" name="pre2012.anios" value={form.pre2012.anios} onChange={onChange} placeholder="Ej: 2"/>
              </div>
              <div>
                <div className="label">Meses <strong>antes</strong> del 12/02/2012</div>
                <input className="input" type="number" name="pre2012.meses" value={form.pre2012.meses} onChange={onChange} placeholder="Ej: 3"/>
              </div>
            </div>
            <div className="row" style={{marginTop:12}}>
              <div>
                <div className="label">Base reguladora mensual (€) <span className="small">si no sabes, usa tu salario bruto mensual</span></div>
                <input className="input" type="number" name="baseReguladoraMensual" value={form.baseReguladoraMensual} onChange={onChange} placeholder="Ej: 2200" required/>
              </div>
              <div>
                <div className="label">Días cotizados en los últimos 6 años</div>
                <input className="input" type="number" name="diasCotizados" value={form.diasCotizados} onChange={onChange} placeholder="Ej: 1320 (≈ 4 años + 2 meses)" required/>
              </div>
            </div>
          </details>

          <div>
            <button className="btn" type="submit" disabled={loading}>{loading ? "Calculando..." : "Calcular"}</button>
          </div>
        </form>

        {resultado && !resultado.error && (
          <div style={{marginTop:20}}>
            <div className="kpi">
              <div className="box">
                <div className="label">Indemnización estimada</div>
                <div style={{fontSize:26, fontWeight:800}}>{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(resultado.indemnizacion || 0)}</div>
                <div className="small">Los topes legales pueden limitar la cifra (24 mensualidades en improcedente; 12 en objetivo).</div>
              </div>
              <div className="box">
                <div className="label">Duración total del paro</div>
                <div style={{fontSize:26, fontWeight:800}}>{resultado.paro?.duracionDias || 0} días</div>
                <div className="small">Según días cotizados SEPE.</div>
              </div>
            </div>

            <div className="grid" style={{gridTemplateColumns:"repeat(12,1fr)", gap:16, marginTop:16}}>
              <div className="result" style={{gridColumn:"span 6"}}>
                <div className="label">Paro (primeros 180 días)</div>
                <div style={{fontSize:22, fontWeight:700}}>{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(resultado.paro?.importeTramo1 || 0)} /mes</div>
                <div className="small">Meses: {resultado.paro?.mesesTramo1}</div>
              </div>
              <div className="result" style={{gridColumn:"span 6"}}>
                <div className="label">Paro (resto)</div>
                <div style={{fontSize:22, fontWeight:700}}>{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(resultado.paro?.importeTramo2 || 0)} /mes</div>
                <div className="small">Meses: {resultado.paro?.mesesTramo2}</div>
              </div>
            </div>

            <div className="result" style={{marginTop:16}}>
              <div className="label">Total estimado a percibir por paro</div>
              <div style={{fontSize:22, fontWeight:700}}>{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(resultado.paro?.totalEstimado || 0)}</div>
            </div>

            <hr />
            <div className="notice">
              <ul>
                <li>Se usa IPREM mensual 600 € con incremento de 1/6 para límites mínimos y máximos.</li>
                <li>Prestación contributiva: 70% de base reguladora los primeros 180 días; 60% después.</li>
                <li>Duración según días cotizados en los últimos 6 años.</li>
                <li>Esta herramienta es orientativa. Revisa tu caso en el simulador oficial del SEPE.</li>
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
