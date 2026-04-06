'use client'

import { useEffect, useRef } from 'react'
import { useRealtimeProducts } from '@/hooks/use-realtime'

export function useScanner(onScan: (product: any, rawCode: string) => void, enabled: boolean = true) {
  const { products } = useRealtimeProducts()
  const scanBuffer = useRef('')
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastKeyTime = useRef<number>(0)
  const isHuman = useRef<boolean>(false)

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está tipeando conscientemente dentro de un input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const now = e.timeStamp
      const timeDiff = now - lastKeyTime.current
      lastKeyTime.current = now

      // Si el buffer ya empezó y el tiempo entre teclas es "humano" (> 35ms), flag.
      if (scanBuffer.current.length > 0 && timeDiff > 35) {
        isHuman.current = true
      }

      if (e.key === 'Enter') {
        const code = scanBuffer.current.trim()
        const wasHuman = isHuman.current
        
        // Reset para el siguiente escaneo
        scanBuffer.current = ''
        isHuman.current = false

        // Solo procesamos si no se detectó velocidad humana
        if (code.length >= 3 && !wasHuman) {
          const found = products.find((p: any) => p.sku.toLowerCase() === code.toLowerCase() && p.isActive)
          // Emitimos siempre, incluso si es null, para que la app sepa que se escaneó "algo" no encontrado.
          onScan(found || null, code)
        }
      } else if (e.key.length === 1) { // Solo añadir caracteres normales
        scanBuffer.current += e.key
        
        // Si hay una pausa mayor a 100ms, vaciamos el buffer entero.
        if (scanTimer.current) clearTimeout(scanTimer.current)
        scanTimer.current = setTimeout(() => { 
          scanBuffer.current = '' 
          isHuman.current = false
        }, 100)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, products, onScan])

  return null
}
