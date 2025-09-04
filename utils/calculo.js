// Utilidades de cálculo para indemnización y paro en España (estimativo, 2025)
export const IPREM_MENSUAL_2025 = 600; // € (prorrogados PGE 2023 -> IPREM 600 €/mes)
export const IPREM_CON_1_6 = IPREM_MENSUAL_2025 * (1 + 1/6); // incremento de 1/6 para topes

// Tabla SEPE: días cotizados -> días de prestación (articulada públicamente)
export function diasPrestacionPorCotizados(diasCotizados) {
  const tabla = [
    { min: 360, max: 539, prestacion: 120 },
    { min: 540, max: 719, prestacion: 180 },
    { min: 720, max: 899, prestacion: 240 },
    { min: 900, max: 1079, prestacion: 300 },
    { min: 1080, max: 1259, prestacion: 360 },
    { min: 1260, max: 1439, prestacion: 420 },
    { min: 1440, max: 1619, prestacion: 480 },
    { min: 1620, max: 1799, prestacion: 540 },
    { min: 1800, max: 1979, prestacion: 600 },
    { min: 1980, max: 2159, prestacion: 660 },
    { min: 2160, max: Infinity, prestacion: 720 },
  ];
  for (const row of tabla) {
    if (diasCotizados >= row.min && diasCotizados <= row.max) return row.prestacion;
  }
  return 0;
}

// Topes de paro por hijos a cargo (0,1,2+)
export function topesParo(hijos) {
  const base = IPREM_CON_1_6;
  const minSin = 0.80 * base;   // 80%
  const minCon = 1.07 * base;   // 107%
  const max0 = 1.75 * base;     // 175%
  const max1 = 2.00 * base;     // 200%
  const max2 = 2.25 * base;     // 225%
  const min = hijos && hijos > 0 ? minCon : minSin;
  const max = hijos >= 2 ? max2 : (hijos === 1 ? max1 : max0);
  return { min: round2(min), max: round2(max) };
}

export function clamp(valor, min, max) {
  return Math.max(min, Math.min(max, valor));
}

export function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

// Cálculo indemnización (simplificado):
// - improcedente: 33 días/año (tope 24 mensualidades)
// - objetivo: 20 días/año (tope 12 mensualidades)
// - fin-contrato: 12 días/año (práctica habitual)
// - baja voluntaria: 0
// Admite tramo anterior a 12/02/2012 a 45 días/año (opcional).
export function calcularIndemnizacion({ tipoDespido, salarioMensualBruto, anios, meses, pre2012 = { anios: 0, meses: 0 } }) {
  const diasPorMes = 30;
  const salarioDiario = salarioMensualBruto / diasPorMes;
  const antigTotalAnios = (anios || 0) + (meses || 0) / 12;

  const antigPre2012 = (pre2012?.anios || 0) + (pre2012?.meses || 0) / 12;
  const antigPost2012 = Math.max(0, antigTotalAnios - antigPre2012);

  let diasPorAnio = 0;
  let topeMensualidades = 0;

  if (tipoDespido === "improcedente") {
    // Tramo dual si hay antigüedad pre-2012
    const tramoPre = salarioDiario * 45 * antigPre2012;
    const tramoPost = salarioDiario * 33 * antigPost2012;
    let indemnizacion = tramoPre + tramoPost;
    const tope = salarioMensualBruto * 24; // 24 mensualidades
    indemnizacion = Math.min(indemnizacion, tope);
    return round2(indemnizacion);
  }

  if (tipoDespido === "objetivo") {
    diasPorAnio = 20;
    topeMensualidades = 12;
  } else if (tipoDespido === "fin-contrato") {
    diasPorAnio = 12;
    topeMensualidades = Infinity; // sin tope legal general
  } else {
    // baja voluntaria u otros sin indemnización
    return 0;
  }

  const indemn = salarioDiario * diasPorAnio * antigTotalAnios;
  const tope = (topeMensualidades === Infinity) ? Infinity : salarioMensualBruto * topeMensualidades;
  return round2(Math.min(indemn, tope));
}

// Cálculo de prestación contributiva ("paro") mensual por tramos (estimación)
export function calcularParo({ baseReguladoraMensual, diasCotizados, hijos = 0 }) {
  // Duración total en días
  const duracionDias = diasPrestacionPorCotizados(diasCotizados);
  if (duracionDias === 0) {
    return { duracionDias: 0, mesesTramo1: 0, mesesTramo2: 0, importeTramo1: 0, importeTramo2: 0, totalEstimado: 0 };
  }
  const { min, max } = topesParo(hijos);
  const tramo1Dias = Math.min(180, duracionDias);
  const tramo2Dias = Math.max(0, duracionDias - 180);

  const importe70 = 0.70 * baseReguladoraMensual;
  const importe60 = 0.60 * baseReguladoraMensual;

  const mensualTramo1 = clamp(importe70, min, max);
  const mensualTramo2 = clamp(importe60, min, max);

  const mesesTramo1 = Math.round((tramo1Dias / 30) * 100) / 100;
  const mesesTramo2 = Math.round((tramo2Dias / 30) * 100) / 100;

  const totalEstimado = round2(mensualTramo1 * mesesTramo1 + mensualTramo2 * mesesTramo2);

  return {
    duracionDias,
    mesesTramo1,
    mesesTramo2,
    importeTramo1: round2(mensualTramo1),
    importeTramo2: round2(mensualTramo2),
    totalEstimado
  };
}
