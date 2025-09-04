# Calculadora Paro + Indemnización (España) · 2025

Web estimativa para calcular **indemnización por despido** y **prestación contributiva (paro)** en España.

> **Aviso**: Es una estimación. Las normas pueden cambiar y hay matices (convenios, bases de cotización reales, parcialidad, etc.). Verifica siempre en el [simulador oficial del SEPE] y con tu asesoría.

## 📦 Stack
- Next.js 14 (Pages Router)
- API Routes (`/pages/api/calcular.js`)
- UI simple (CSS)

## ▶️ Desarrollo local
```bash
npm i
npm run dev
# abre http://localhost:3000
```

## 🚀 Despliegue en Vercel
1. Sube este repo a GitHub.
2. Entra a **Vercel** → *New Project* → Importa el repo.
3. Selecciona el framework **Next.js** (auto-detectado) y despliega.
4. Obtendrás una URL pública tipo `https://tu-proyecto.vercel.app`.

## ⚙️ Cómo se calcula
- **Indemnización**:
  - Improcedente: 33 días/año trabajado (tope 24 mensualidades). Si hubo antigüedad **previa al 12/02/2012**, ese tramo se calcula a **45 días/año** y el resto a 33.
  - Objetivo: 20 días/año (tope 12 mensualidades).
  - Fin de contrato: 12 días/año (práctica común).
  - Baja voluntaria: 0€.

- **Paro (prestación contributiva)**:
  - Se toma la **base reguladora mensual** (si no la conoces, usa tu **salario bruto mensual con pagas prorrateadas** como aproximación).
  - **70%** los primeros **180 días** y **60%** el resto.
  - **Duración** según **días cotizados en los últimos 6 años** (tabla oficial del SEPE).
  - **Límites** según IPREM mensual **600€** (2025) **incrementado en 1/6**:
    - **Mínimos**: 80% (sin hijos) / 107% (con hijos).
    - **Máximos**: 175% (0 hijos), 200% (1 hijo), 225% (2+).
  - Ejemplos típicos para 2025: **mínimo sin hijos ≈ 560€**, con hijos ≈ **749€**; **máximos**: 1225€ / 1400€ / 1575€.

## 📚 Fuentes
- SEPE – Duración prestación contributiva (tabla de días cotizados → días de derecho).
- SEPE / Seguridad Social – Cuantía: 70% (180 días) y 60% después, topes por **IPREM**.
- IPREM 2025 mensual: **600€** (con PGE prorrogados de 2023).

## 📝 Nota legal
Esta herramienta no recoge particularidades como **parcialidad**, **bases de cotización reales** del último semestre, **coeficientes de jornadas**, **convenios** o **mejoras**. Es orientativa.

— Hecho por Viking & ChatGPT · Proyecto ExtractDataHub
