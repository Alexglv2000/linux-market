'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PaymentModal } from '@/components/payment-modal'
import { useAuth } from '@/lib/auth-context'
import { salesApi, productsApi } from '@/lib/api'
import { useRealtimeProducts } from '@/hooks/use-realtime'
import { useSettings } from '@/lib/settings-context'
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Package,
  CheckCircle, ReceiptText, X, Tag, Wifi, WifiOff, RefreshCw, AlertCircle, Shield, Monitor
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface CartItem {
  product: any
  quantity: number
  discount: number
}

export default function POSPage() {
  const { user } = useAuth()
  const { products, connected, loading, refresh } = useRealtimeProducts()
  useEffect(() => {
    // Solo informamos en consola si no es nativo, pero permitimos el acceso
    if (typeof window !== 'undefined' && !(window as any).__TAURI__) {
      console.log('[LinuxMarket] Ejecutando en entorno web compartido.')
    }
  }, [])

  const [filtered, setFiltered] = useState<any[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [lastSale, setLastSale] = useState<any | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const { settings } = useSettings()
  const taxRate = parseFloat(settings.tax_rate || '16')
  const logoUrl = settings.ticket_logo_url || settings.global_logo_url || ''
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { searchRef.current?.focus() }, [])

  useEffect(() => {
    const q = search.trim().toLowerCase()

    // Autodetección por código de barras: SKU exacto en ≥3 chars → agrega directo
    if (q.length >= 3) {
      const exactMatch = products.find(p => p.sku.toLowerCase() === q && p.isActive && p.stock > 0)
      if (exactMatch) {
        addToCart(exactMatch)
        setSearch('')
        return
      }
    }

    setFiltered(
      products.filter(p =>
        p.isActive && p.stock > 0 &&
        (category === 'all' || p.category === category) &&
        (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      )
    )
  }, [search, category, products])

  const categories = ['all', ...Array.from(new Set(products.map((p: any) => p.category)))]

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Stock insuficiente para ${product.name}`)
          return prev
        }
        toast.success(`${product.name} actualizado: x${existing.quantity + 1}`, { duration: 1500, icon: <Package className="w-4 h-4 text-primary" /> })
        return prev.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      toast.success(`${product.name} agregado`, { duration: 1500, icon: <ShoppingCart className="w-4 h-4 text-primary" /> })
      return [...prev, { product, quantity: 1, discount: 0 }]
    })
  }

  const updateQty = (id: number, qty: number) => {
    if (qty <= 0) { removeFromCart(id); return }
    setCart(prev => prev.map(c => c.product.id === id ? { ...c, quantity: Math.min(qty, c.product.stock) } : c))
  }

  const updateDiscount = (id: number, pct: number) =>
    setCart(prev => prev.map(c => c.product.id === id ? { ...c, discount: Math.min(Math.max(pct, 0), 100) } : c))

  const removeFromCart = (id: number) => setCart(prev => prev.filter(c => c.product.id !== id))

  const itemTotal = (item: CartItem) => item.product.price * item.quantity * (1 - item.discount / 100)
  const subtotal = cart.reduce((s, c) => s + itemTotal(c), 0)
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax
  const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

  const playSuccessSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      osc.start(); osc.stop(ctx.currentTime + 0.1)
    } catch { }
  }

  const handlePaymentConfirm = async (method: 'efectivo' | 'tarjeta' | 'transferencia' | 'qr', reference?: string) => {
    const saleNumber = `VTA-${Date.now().toString(36).toUpperCase()}`
    const salePayload = {
      saleNumber,
      userId: user?.id,
      username: user?.username,
      sucursalId: user?.sucursalId || 'SUC001',
      celulaId: user?.celulaId || 'CEL001',
      subtotal, tax,
      discount: cart.reduce((s, c) => s + (c.product.price * c.quantity * c.discount / 100), 0),
      total,
      paymentMethod: method,
      status: 'completada',
      items: cart.map(c => ({
        productId: c.product.id,
        sku: c.product.sku,
        name: c.product.name,
        quantity: c.quantity,
        price: c.product.price,
        subtotal: itemTotal(c),
      })),
    }

    try {
      // El servidor descuenta stock atómicamente y hace broadcast a todos los clientes
      const created = await salesApi.create(salePayload)
      setLastSale({ ...created, items: salePayload.items })
      
      // 🚀 REDUNDANCIA DE HARDWARE: Abrir cajón automáticamente
      if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
        try {
          const { invoke } = await import('@tauri-apps/api/core')
          await invoke('open_drawer')
        } catch (hwError) {
          console.warn('[Hardware] No se pudo abrir el cajón automáticamente:', hwError)
        }
      }

      setCart([])
      setPaymentOpen(false)
      setShowReceipt(true)
      playSuccessSound()
    } catch (e: any) {
      alert(`Error al procesar venta: ${e.message}`)
    }
  }

  const handleManualDrawer = async () => {
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        const res = await invoke('open_drawer')
        toast.success(String(res))
      } catch (e: any) {
        toast.error('Error hardware: ' + e.message)
      }
    } else {
      toast.error('La apertura remota de cajón no está permitida por seguridad.')
    }
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">Conectando al servidor...</p>
      </div>
    </div>
  )

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden">
      {/* Product grid */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b border-white/10 bg-card/30 backdrop-blur space-y-3">
          {/* Estado de conexión */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1.5 text-xs ${connected ? 'text-green-500' : 'text-amber-500'}`}>
              {connected
                ? <><Wifi className="w-3 h-3" /> Sincronizado en tiempo real</>
                : <><WifiOff className="w-3 h-3" /> Reconectando...</>
              }
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="h-6 text-xs text-muted-foreground" onClick={refresh}>
                <RefreshCw className="w-3 h-3 mr-1" /> Actualizar
              </Button>
              <Link href="/store/dashboard/pos/kiosk">
                <Button size="sm" variant="outline" className="h-6 text-xs border-primary/30 text-primary hover:bg-primary/10">
                  <Monitor className="w-3 h-3 mr-1" /> Modo Autocobro
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o escanear código de barras..."
              className="pl-9 bg-background/50 border-white/10 h-11" />
            {search && (
              <Button size="sm" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => setSearch('')}>
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <Button key={cat} size="sm" variant={category === cat ? 'default' : 'outline'} onClick={() => setCategory(cat)}
                className={`shrink-0 text-xs h-7 rounded-full ${category === cat ? 'bg-gradient-to-r from-primary to-accent' : 'border-white/10'}`}>
                {cat === 'all' ? 'Todo' : cat}
              </Button>
            ))}
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16">
                <Package className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Sin productos disponibles</p>
              </div>
            ) : filtered.map(product => {
              const inCart = cart.find(c => c.product.id === product.id)
              return (
                <button key={product.id} onClick={() => addToCart(product)}
                  className={`group relative p-4 rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-95 ${inCart ? 'border-primary/50 bg-primary/10' : 'border-white/10 bg-card/30 hover:border-primary/30'}`}>
                  {inCart && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">{inCart.quantity}</div>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center mb-3">
                    <Tag className="w-5 h-5 text-primary" />
                  </div>
                  <div className="font-semibold text-sm leading-tight mb-1 line-clamp-2">{product.name}</div>
                  <div className="text-xs text-muted-foreground font-mono mb-2">{product.sku}</div>
                  <div className="flex items-center justify-between">
                    <div className="font-black text-primary">{fmt(product.price)}</div>
                    <Badge variant={product.stock <= product.minStock ? 'destructive' : 'secondary'} className="text-[10px] px-1.5">
                      {product.stock}
                    </Badge>
                  </div>
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Cart panel */}
      <div className="w-96 border-l border-white/10 bg-card/50 backdrop-blur flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <ShoppingCart className="w-4 h-4 text-primary" />
            Carrito
            {cart.length > 0 && <Badge className="bg-primary text-white text-xs">{cart.reduce((s, c) => s + c.quantity, 0)}</Badge>}
          </div>
          {cart.length > 0 && (
            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:bg-destructive/10" onClick={() => setCart([])}>
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Limpiar
            </Button>
          )}
        </div>
        <ScrollArea className="flex-1">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-6">
              <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Carrito vacío</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {cart.map(item => (
                <div key={item.product.id} className="p-3 rounded-xl border border-white/10 bg-background/30 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium leading-tight line-clamp-1">{item.product.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{item.product.sku}</div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive shrink-0" onClick={() => removeFromCart(item.product.id)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0 border-white/10" onClick={() => updateQty(item.product.id, item.quantity - 1)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Input type="number" value={item.quantity} onChange={e => updateQty(item.product.id, parseInt(e.target.value) || 0)}
                      className="h-7 w-14 text-center text-sm p-0 bg-background/50 border-white/10 font-mono" min={1} max={item.product.stock} />
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0 border-white/10" onClick={() => updateQty(item.product.id, item.quantity + 1)} disabled={item.quantity >= item.product.stock}>
                      <Plus className="w-3 h-3" />
                    </Button>
                    <div className="flex-1 text-right font-bold text-sm">{fmt(itemTotal(item))}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">Desc.%</span>
                    <Input type="number" value={item.discount} onChange={e => updateDiscount(item.product.id, parseFloat(e.target.value) || 0)}
                      className="h-6 w-14 text-center text-xs p-0 bg-background/50 border-white/10 font-mono" min={0} max={100} />
                    {item.discount > 0 && <span className="text-[10px] text-green-400">-{fmt(item.product.price * item.quantity * item.discount / 100)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-4 border-t border-white/10 bg-card/80 space-y-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>IVA ({taxRate}%)</span><span>{fmt(tax)}</span></div>
            <Separator className="bg-white/10" />
            <div className="flex justify-between font-black text-xl">
              <span>Total</span><span className="text-primary">{fmt(total)}</span>
            </div>
            {/* Botón de Emergencia Hardware */}
            {typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleManualDrawer}
                className="w-full h-8 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-primary hover:bg-primary/5 border border-dashed border-white/5 mt-2 transition-all group"
              >
                <Shield className="w-3 h-3 mr-2 group-hover:animate-pulse" />
                Liberar Cajón (Emergencia)
              </Button>
            )}
          </div>
          <Button className={`w-full h-12 text-base font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-xl shadow-primary/30 rounded-xl transition-all active:scale-95 ${cart.length > 0 ? 'animate-pulse-slow' : ''}`}
            disabled={cart.length === 0} onClick={() => setPaymentOpen(true)}>
            <ShoppingCart className="w-5 h-5 mr-2" />
            Cobrar {cart.length > 0 ? fmt(total) : ''}
          </Button>
        </div>
      </div>

      <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} total={total} onConfirm={handlePaymentConfirm} />

      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6 text-center border-b border-white/10">
              {logoUrl && <img src={logoUrl} alt="Logo" className="h-12 mx-auto mb-4 object-contain" />}
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h2 className="text-xl font-black">Venta completada</h2>
              <p className="text-sm font-bold text-primary mt-1">Atendió: {user?.name}</p>
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">{lastSale.saleNumber}</p>
            </div>
            <div className="p-4 space-y-2 text-sm max-h-64 overflow-y-auto">
              {lastSale.items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between">
                  <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                  <span>{fmt(item.subtotal)}</span>
                </div>
              ))}
              <Separator className="bg-white/10 my-2" />
              <div className="flex justify-between font-black text-lg"><span>Total</span><span className="text-green-400">{fmt(lastSale.total)}</span></div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>Método</span><span className="capitalize">{lastSale.paymentMethod}</span></div>
            </div>
            <div className="p-4 pt-0 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 border-white/10 gap-1.5" onClick={() => window.print()}>
                <ReceiptText className="w-3.5 h-3.5" /> Imprimir
              </Button>
              <Button size="sm" className="flex-1 bg-gradient-to-r from-primary to-accent" onClick={() => setShowReceipt(false)}>Nueva venta</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
