'use client'

/**
 * hooks/use-realtime.ts
 * Hook que mantiene productos y ventas sincronizados en tiempo real via SSE.
 * Lanza fetch inicial y actualiza estado al recibir eventos del servidor.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  productsApi, salesApi, transfersApi, usersApi, settingsApi, statsApi,
  connectRealtime, type RealtimeEvent 
} from '@/lib/api'
import { useSettings } from '@/lib/settings-context'
import { toast } from 'sonner'

export interface RealtimeState {
  products: any[]
  sales: any[]
  transfers: any[]
  users: any[]
  settings: Record<string, string>
  stats: any
  connected: boolean
  loading: boolean
  refresh: () => void
}

export function useRealtime(): RealtimeState {
  const [products, setProducts] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [transfers, setTransfers] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [stats, setStats] = useState<any>(null)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  const { refreshSettings } = useSettings()

  const loadAll = useCallback(async () => {
    try {
      const [prods, sls, trs, allUsers, allSettings, currentStats] = await Promise.all([
        productsApi.getAll(true),
        salesApi.getAll(),
        transfersApi.getAll(),
        usersApi.getAll(),
        settingsApi.get(),
        statsApi.get()
      ])
      if (!mountedRef.current) return
      setProducts(prods)
      setSales(sls)
      setTransfers(trs)
      setUsers(allUsers)
      setSettings(allSettings)
      setStats(currentStats)
    } catch (e) {
      console.warn('[Realtime] No se pudo conectar a la API, modo offline.')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    loadAll()

    const disconnect = connectRealtime(
      (event: RealtimeEvent, data: any) => {
        if (!mountedRef.current) return
        switch (event) {
          case 'product_created':
            setProducts(prev => {
              const exists = prev.find(p => p.id === data.id)
              return exists ? prev.map(p => p.id === data.id ? data : p) : [...prev, data]
            })
            break
          case 'product_updated':
            setProducts(prev =>
              prev.map(p => p.id === data.id ? data : p)
                  .filter(p => p.isActive)
            )
            break
          case 'product_deleted':
            setProducts(prev => prev.filter(p => p.id !== data.id))
            break
          case 'products_bulk_update':
            productsApi.getAll(true).then(prods => {
              if (mountedRef.current) setProducts(prods)
            })
            break
          case 'sale_created':
            setSales(prev => [data, ...prev].slice(0, 500))
            // Recargar estadísticas tras cada venta para precisión total en ingresos históricos
            statsApi.get().then(s => { if (mountedRef.current) setStats(s) })
            break
          case 'transfer_created':
            setTransfers(prev => [data, ...prev])
            toast.info(`Nueva transferencia: ${data.transferNumber}`, {
              description: `De ${data.fromSucursalId} a ${data.toSucursalId}`,
              icon: '🚚'
            })
            break
          case 'transfer_updated':
            setTransfers(prev => prev.map(t => t.id === data.id ? data : t))
            if (data.status === 'en_transito') toast.success(`Transferencia ${data.transferNumber} en camino`)
            if (data.status === 'completada') toast.success(`Transferencia ${data.transferNumber} completada`)
            break
          case 'user_created':
            setUsers(prev => [...prev, data])
            toast.success(`Nuevo usuario creado: ${data.username}`)
            break
          case 'user_updated':
            setUsers(prev => prev.map(u => u.id === data.id ? data : u))
            break
          case 'settings_updated':
            setSettings(prev => ({ ...prev, [data.key]: data.value }))
            refreshSettings?.()
            toast.success(`Configuración actualizada: ${data.key}`)
            break
        }
      },
      (isConnected) => {
        if (mountedRef.current) setConnected(isConnected)
      }
    )

    return () => {
      mountedRef.current = false
      disconnect()
    }
  }, [loadAll])

  return { products, sales, transfers, users, settings, stats, connected, loading, refresh: loadAll }
}

/**
 * Hook simplificado solo para productos (usado por el almacenista y POS)
 */
export function useRealtimeProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  const load = useCallback(async () => {
    try {
      const prods = await productsApi.getAll(true)
      if (mountedRef.current) { setProducts(prods); setLoading(false) }
    } catch {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    load()

    const disconnect = connectRealtime(
      (event, data) => {
        if (!mountedRef.current) return
        if (event === 'product_created') {
          setProducts(prev => {
            const exists = prev.find(p => p.id === data.id)
            return exists ? prev.map(p => p.id === data.id ? data : p) : [...prev, data]
          })
        } else if (event === 'product_updated') {
          setProducts(prev =>
            data.isActive
              ? prev.map(p => p.id === data.id ? data : p)
              : prev.filter(p => p.id !== data.id)
          )
        } else if (event === 'product_deleted') {
          setProducts(prev => prev.filter(p => p.id !== data.id))
        } else if (event === 'products_bulk_update') {
          load()
        }
      },
      setConnected
    )

    return () => { mountedRef.current = false; disconnect() }
  }, [load])

  return { products, connected, loading, refresh: load, setProducts }
}
