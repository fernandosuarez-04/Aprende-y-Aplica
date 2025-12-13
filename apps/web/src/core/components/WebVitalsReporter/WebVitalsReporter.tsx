'use client'

import { useEffect } from 'react'
import { useReportWebVitals } from 'next/web-vitals'
import { reportWebVitals } from '@/lib/analytics/web-vitals'

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    reportWebVitals(metric)
  })

  return null
}
