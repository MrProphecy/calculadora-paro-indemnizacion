import { calcularIndemnizacion, calcularParo } from "../../utils/calculo";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { salarioMensualBruto, anios, meses, tipoDespido, pre2012 = { anios: 0, meses: 0 }, baseReguladoraMensual, diasCotizados, hijos = 0 } = req.body;

    const indemnizacion = calcularIndemnizacion({
      tipoDespido,
      salarioMensualBruto: Number(salarioMensualBruto || 0),
      anios: Number(anios || 0),
      meses: Number(meses || 0),
      pre2012: { anios: Number(pre2012?.anios || 0), meses: Number(pre2012?.meses || 0) },
    });

    const paro = calcularParo({
      baseReguladoraMensual: Number(baseReguladoraMensual || 0),
      diasCotizados: Number(diasCotizados || 0),
      hijos: Number(hijos || 0),
    });

    return res.status(200).json({ indemnizacion, paro });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: "Error en el cálculo", detail: String(e) });
  }
}
