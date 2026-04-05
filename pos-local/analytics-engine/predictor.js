/**
 * Linux-Market POS - Motor Analítico v1.0
 * Métodos numéricos reales: regresión lineal, promedio móvil ponderado,
 * suavizado exponencial, índices estacionales, intervalos de confianza.
 */

'use strict'

// ── Regresión Lineal (Mínimos Cuadrados) ────────────────────────────────────
function regresionLineal(datos) {
  const n = datos.length
  if (n < 2) return { pendiente: 0, intercepto: datos[0]?.y ?? 0, r2: 0 }

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  datos.forEach(({ x, y }) => {
    sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x
  })

  const pendiente = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercepto = (sumY - pendiente * sumX) / n

  // Coeficiente R²
  const yMedia = sumY / n
  let ssTot = 0, ssRes = 0
  datos.forEach(({ x, y }) => {
    ssTot += Math.pow(y - yMedia, 2)
    ssRes += Math.pow(y - (pendiente * x + intercepto), 2)
  })
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot

  return { pendiente, intercepto, r2 }
}

// ── Promedio Móvil Ponderado ──────────────────────────────────────────────
function promedioMovilPonderado(serie, ventana = 7) {
  if (serie.length < ventana) ventana = serie.length
  const pesos = Array.from({ length: ventana }, (_, i) => i + 1)
  const sumPesos = pesos.reduce((a, b) => a + b, 0)
  const slice = serie.slice(-ventana)
  return slice.reduce((acc, val, i) => acc + val * pesos[i], 0) / sumPesos
}

// ── Suavizado Exponencial (Holt-Winters simple) ──────────────────────────
function suavizadoExponencial(serie, alpha = 0.3) {
  if (serie.length === 0) return 0
  let nivel = serie[0]
  for (let i = 1; i < serie.length; i++) {
    nivel = alpha * serie[i] + (1 - alpha) * nivel
  }
  return nivel
}

// ── Desviación Estándar y Varianza ───────────────────────────────────────
function estadisticas(serie) {
  if (serie.length === 0) return { media: 0, desviacion: 0, min: 0, max: 0 }
  const n = serie.length
  const media = serie.reduce((a, b) => a + b, 0) / n
  const varianza = serie.reduce((acc, v) => acc + Math.pow(v - media, 2), 0) / n
  const desviacion = Math.sqrt(varianza)
  return { media, desviacion, varianza, min: Math.min(...serie), max: Math.max(...serie) }
}

// ── Índices Estacionales por Día de la Semana ────────────────────────────
function indicesPorDia(ventasPorFecha) {
  // ventasPorFecha: array de { fecha: 'YYYY-MM-DD', total: number }
  const acum = Array(7).fill(0)
  const conteo = Array(7).fill(0)
  ventasPorFecha.forEach(({ fecha, total }) => {
    const dia = new Date(fecha + 'T12:00:00').getDay() // 0=Dom, 6=Sab
    acum[dia] += total
    conteo[dia]++
  })
  const promedios = acum.map((s, i) => conteo[i] ? s / conteo[i] : 0)
  const mediaGlobal = promedios.reduce((a, b) => a + b, 0) / 7 || 1
  const nombres = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
  return promedios.map((p, i) => ({
    dia: nombres[i],
    promedio: Math.round(p * 100) / 100,
    indice: Math.round((p / mediaGlobal) * 1000) / 1000
  }))
}

// ── Índices por Hora ──────────────────────────────────────────────────────
function indicesPorHora(ventasConHora) {
  // ventasConHora: array de { hora: number (0-23), total: number }
  const acum = Array(24).fill(0)
  const conteo = Array(24).fill(0)
  ventasConHora.forEach(({ hora, total }) => {
    acum[hora] += total; conteo[hora]++
  })
  const promedios = acum.map((s, i) => conteo[i] ? s / conteo[i] : 0)
  const mediaGlobal = promedios.reduce((a, b) => a + b, 0) / 24 || 1
  return promedios.map((p, i) => ({
    hora: i,
    promedio: Math.round(p * 100) / 100,
    indice: Math.round((p / mediaGlobal) * 1000) / 1000
  }))
}

// ── Intervalo de Confianza (95%) ─────────────────────────────────────────
function intervaloConfianza95(serie) {
  const { media, desviacion } = estadisticas(serie)
  const n = serie.length
  if (n < 2) return { inferior: media, superior: media }
  // t-value aproximado para 95% con n grande ≈ 1.96
  const t = n >= 30 ? 1.96 : [0,12.706,4.303,3.182,2.776,2.571,2.447,2.365,2.306,2.262,2.228][Math.min(n-1,10)] ?? 2.0
  const margen = t * (desviacion / Math.sqrt(n))
  return {
    inferior: Math.max(0, Math.round((media - margen) * 100) / 100),
    superior: Math.round((media + margen) * 100) / 100
  }
}

// ── Predicción Principal ──────────────────────────────────────────────────
function predecir(historial, diasAdelante = 7) {
  /**
   * historial: array de { fecha: 'YYYY-MM-DD', total: number }
   * ordenado de más antiguo a más reciente
   */
  if (!historial || historial.length < 3) {
    return { error: 'Historial insuficiente (mínimo 3 días)', predicciones: [] }
  }

  const serie = historial.map(h => h.total)
  const { pendiente, intercepto, r2 } = regresionLineal(
    historial.map((h, i) => ({ x: i, y: h.total }))
  )
  const pmp    = promedioMovilPonderado(serie, Math.min(14, serie.length))
  const exp    = suavizadoExponencial(serie, 0.3)
  const stats  = estadisticas(serie)
  const ic     = intervaloConfianza95(serie)
  const indDia = indicesPorDia(historial)

  const n = historial.length
  const predicciones = []

  for (let d = 1; d <= diasAdelante; d++) {
    const xFuturo    = n - 1 + d
    const baseLineal = Math.max(0, pendiente * xFuturo + intercepto)
    const baseHybrid = (baseLineal * 0.4 + pmp * 0.35 + exp * 0.25)

    // Aplicar índice estacional del día
    const fechaFutura = new Date()
    fechaFutura.setDate(fechaFutura.getDate() + d)
    const diaSemana = fechaFutura.getDay()
    const indice = indDia[diaSemana]?.indice ?? 1

    const prediccion = Math.max(0, Math.round(baseHybrid * indice * 100) / 100)
    const errorEst   = stats.desviacion * indice

    predicciones.push({
      fecha:         fechaFutura.toISOString().split('T')[0],
      dia:           indDia[diaSemana]?.dia,
      prediccion,
      inferior:      Math.max(0, Math.round((prediccion - errorEst) * 100) / 100),
      superior:      Math.round((prediccion + errorEst) * 100) / 100,
      indiceEstacion: indice
    })
  }

  // Recomendaciones automáticas
  const recomendaciones = generarRecomendaciones(serie, indDia, stats, r2)

  return {
    predicciones,
    tendencia: { pendiente: Math.round(pendiente * 100) / 100, r2: Math.round(r2 * 1000) / 1000 },
    promedioMovil: Math.round(pmp * 100) / 100,
    estadisticas:  stats,
    intervaloConfianza95: ic,
    indicesPorDia: indDia,
    recomendaciones
  }
}

// ── Recomendaciones Automáticas ───────────────────────────────────────────
function generarRecomendaciones(serie, indDia, stats, r2) {
  const recs = []
  const { media, desviacion } = stats
  const ultimo = serie[serie.length - 1]

  // Tendencia
  const delta = serie.length >= 7
    ? serie.slice(-7).reduce((a, b) => a + b, 0) / 7
    - serie.slice(-14, -7).reduce((a, b) => a + b, 0) / 7
    : 0

  if (delta > media * 0.1)
    recs.push({ tipo: 'positivo', mensaje: `Las ventas subieron ${Math.round(delta)} en la ultima semana. Asegurate de tener stock suficiente.` })
  else if (delta < -media * 0.1)
    recs.push({ tipo: 'alerta', mensaje: `Ventas a la baja esta semana. Considera promociones para los dias de menor trafico.` })

  // Mejor dia
  const mejorDia = indDia.reduce((a, b) => a.indice > b.indice ? a : b)
  if (mejorDia.indice > 1.2)
    recs.push({ tipo: 'info', mensaje: `${mejorDia.dia} es tu mejor dia (${Math.round((mejorDia.indice - 1) * 100)}% sobre el promedio). Planifica personal extra.` })

  // Anomalias
  if (ultimo > media + 2 * desviacion)
    recs.push({ tipo: 'info', mensaje: 'Venta inusualmente alta detectada. Verifica si fue por evento especial para replicarlo.' })
  else if (ultimo < media - 2 * desviacion)
    recs.push({ tipo: 'alerta', mensaje: 'Venta muy baja detectada. Revisa si hubo algún problema operativo.' })

  // Precision del modelo
  if (r2 < 0.4)
    recs.push({ tipo: 'info', mensaje: 'El patron de ventas es irregular. Agrega mas historial para predicciones mas precisas.' })

  return recs
}

module.exports = { predecir, regresionLineal, promedioMovilPonderado, suavizadoExponencial, estadisticas, indicesPorDia, indicesPorHora, intervaloConfianza95 }
