import type { NextWebVitalsMetric } from 'next/app'

/**
 * Reporta Web Vitals a servicio de analytics
 * Se puede integrar con Google Analytics, Vercel Analytics, Sentry, etc.
 */
export function reportWebVitals(metric: NextWebVitalsMetric) {
  // Solo en producción
  if (process.env.NODE_ENV !== 'production') {
    return
  }

  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
  })

  // Ejemplo 1: Enviar a Google Analytics 4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    })
  }

  // Ejemplo 2: Enviar a endpoint personalizado
  const url = '/api/analytics/web-vitals'

  // Usar sendBeacon si está disponible, sino usar fetch
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body)
  } else {
    fetch(url, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch((error) => {
      // Falló silenciosamente - no queremos que afecte la app
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send web vitals:', error)
      }
    })
  }

  // Log en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Web Vital:', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
    })
  }
}

/**
 * Thresholds para Core Web Vitals
 * Fuente: https://web.dev/vitals/
 */
export const WEB_VITALS_THRESHOLDS = {
  // Largest Contentful Paint - Mide velocidad de carga
  LCP: {
    good: 2500, // < 2.5s
    needsImprovement: 4000, // 2.5s - 4s
    // > 4s es poor
  },
  // First Input Delay - Mide interactividad
  FID: {
    good: 100, // < 100ms
    needsImprovement: 300, // 100ms - 300ms
    // > 300ms es poor
  },
  // Cumulative Layout Shift - Mide estabilidad visual
  CLS: {
    good: 0.1, // < 0.1
    needsImprovement: 0.25, // 0.1 - 0.25
    // > 0.25 es poor
  },
  // First Contentful Paint
  FCP: {
    good: 1800, // < 1.8s
    needsImprovement: 3000, // 1.8s - 3s
    // > 3s es poor
  },
  // Time to First Byte
  TTFB: {
    good: 800, // < 800ms
    needsImprovement: 1800, // 800ms - 1.8s
    // > 1.8s es poor
  },
}

/**
 * Obtiene el rating de una métrica
 */
export function getMetricRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITALS_THRESHOLDS[name as keyof typeof WEB_VITALS_THRESHOLDS]

  if (!thresholds) return 'poor'

  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.needsImprovement) return 'needs-improvement'
  return 'poor'
}
