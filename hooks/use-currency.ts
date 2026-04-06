'use client'

import { useSettings } from '@/lib/settings-context'
import { useCallback } from 'react'

export function useCurrency() {
  const { settings } = useSettings()
  
  const formatCurrency = useCallback((amount: number) => {
    // Default fallback values if not set in DB
    const locale = settings.currency_locale || 'es-MX'
    const code = settings.currency_code || 'MXN'
    
    try {
      // Some currencies like JPY, CLP natively have 0 decimal digits according to Intl spec.
      // Specifying currency will automatically enforce the correct number of fractions unless overridden!
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: code,
      })
      
      return formatter.format(amount)
    } catch (e) {
      // Fallback si la configuración es un código inválido
      return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
    }
  }, [settings.currency_locale, settings.currency_code])

  return { formatCurrency }
}
