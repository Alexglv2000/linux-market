'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth-context'
import { salesApi } from '@/lib/api'
import { useRealtimeProducts } from '@/hooks/use-realtime'
import { useSettings } from '@/lib/settings-context'
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Package,
  CheckCircle, X, Tag, RefreshCw, CreditCard, Banknote,
  QrCode, Building2, ArrowLeft, Monitor, Maximize2, Minimize2,
  Hand, Touchpad, MousePointer2, Smartphone
} from 'lucide-react'
import { useCurrency } from '@/hooks/use-currency'
import { useScanner } from '@/hooks/use-scanner'

interface CartItem {
  product: any
  quantity: number
}

type KioskStep = 'browse' | 'cart' | 'pay' | 'done'
type PayMethod = 'efectivo' | 'tarjeta' | 'qr' | 'transferencia'

const PAY_METHODS = [
  { id: 'tarjeta' as PayMethod, label: 'Tarjeta', icon: CreditCard, color: 'from-blue-600 to-blue-800' },
  { id: 'efectivo' as PayMethod, label: 'Efectivo', icon: Banknote, color: 'from-green-600 to-green-800' },
  { id: 'qr' as PayMethod, label: 'QR / CoDi', icon: QrCode, color: 'from-orange-500 to-amber-700' },
  { id: 'transferencia' as PayMethod, label: 'Transferencia', icon: Building2, color: 'from-violet-600 to-purple-800' },
]

export default function KioskPage() {
  const { user } = useAuth()
  const { products, loading, refresh } = useRealtimeProducts()
  const { settings } = useSettings()
  const { formatCurrency: fmt } = useCurrency()

  const [step, setStep] = useState<KioskStep>('browse')
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [filtered, setFiltered] = useState<any[]>([])
  const [payMethod, setPayMethod] = useState<PayMethod | null>(null)
  const [cashReceived, setCashReceived] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastSale, setLastSale] = useState<any>(null)
  const [idleTimer, setIdleTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [showIdle, setShowIdle] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const kioskRef = useRef<HTMLDivElement>(null)

  const logoUrl = settings?.global_logo_url || '/iconolinuxmarket.png'
  const taxRate = parseFloat(settings?.tax_rate || '16')

  const subtotal = cart.reduce((s, c) => s + c.product.price * c.quantity, 0)
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax
  const change = parseFloat(cashReceived || '0') - total
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0)
  
  // Hardware Scanner Integration
  useScanner((product, rawCode) => {
    if (step !== 'browse') {
      // Si escanean pero no están en la vista de comprar, regresamos a browse
      setStep('browse')
    }
    if (product) {
      addToCart(product)
    }
  })

  // Idle reset: if no interaction for 60s, return to browse
  const resetIdle = useCallback(() => {
    if (idleTimer) clearTimeout(idleTimer)
    // Pantalla de inactividad a los 45s
    const t = setTimeout(() => {
      // Si está inactivo y NO está en la vista final, mostrar saludo
      if (step !== 'done') {
        setShowIdle(true)
      }
      
      // Reset total agresivo a los 90s: Vaciar el carrito abandonado
      setTimeout(() => {
        setStep('browse')
        setCart([])
        setSearch('')
        setCategory('all')
        setPayMethod(null)
        setCashReceived('')
      }, 45000)
    }, 45000)
    setIdleTimer(t)
    setShowIdle(false)
  }, [idleTimer, step])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      kioskRef.current?.requestFullscreen().catch(err => {
        alert(`Error al activar pantalla completa: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  useEffect(() => {
    const events = ['mousemove', 'touchstart', 'keydown', 'click']
    events.forEach(e => window.addEventListener(e, resetIdle))
    resetIdle()
    return () => events.forEach(e => window.removeEventListener(e, resetIdle))
  }, [])

  useEffect(() => {
    const q = search.trim().toLowerCase()
    setFiltered(
      products.filter(p =>
        p.isActive && p.stock > 0 &&
        (category === 'all' || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      )
    )
  }, [search, category, products])

  const categories = ['all', ...Array.from(new Set(products.map((p: any) => p.category)))]

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return prev
        return prev.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQty = (id: number, qty: number) => {
    if (qty <= 0) setCart(prev => prev.filter(c => c.product.id !== id))
    else setCart(prev => prev.map(c => c.product.id === id ? { ...c, quantity: Math.min(qty, c.product.stock) } : c))
  }

  const handleCheckout = async () => {
    if (!user || !payMethod) return
    setIsProcessing(true)
    try {
      // ESTABILIDAD DE PRECIOS: Limpiar Float Dust antes de Guardar
      const roundedSubtotal = Math.round(subtotal * 100) / 100;
      const roundedTax = Math.round(tax * 100) / 100;
      const roundedTotal = Math.round(total * 100) / 100;

      const salePayload = {
        saleNumber: `KSK-${Date.now().toString(36).toUpperCase()}`,
        userId: user.id,
        username: user.username,
        sucursalId: user.sucursalId || 'SUC001',
        celulaId: user.celulaId || 'CEL001',
        subtotal: roundedSubtotal, tax: roundedTax, discount: 0, total: roundedTotal,
        paymentMethod: payMethod,
        status: 'completada',
        items: cart.map(c => ({
          productId: c.product.id,
          sku: c.product.sku,
          name: c.product.name,
          quantity: c.quantity,
          price: c.product.price,
          subtotal: Math.round(c.product.price * c.quantity * 100) / 100,
        })),
      }
      const created = await salesApi.create(salePayload)
      setLastSale({ ...created, items: salePayload.items })
      setStep('done')
      
      await printTicketHandler(salePayload)

      // Auto-reset after 10 seconds on done screen
      setTimeout(() => {
        setStep('browse')
        setCart([])
        setPayMethod(null)
        setCashReceived('')
        setLastSale(null)
      }, 10000)
    } catch (e: any) {
      alert(`Error al procesar: ${e.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const printTicketHandler = async (salePayload: any) => {
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        
        let ticketStr = `\x1b\x40` // Initialize ESC/POS
        ticketStr += `\x1b\x61\x01` // Center align
        ticketStr += `\x1b\x45\x01LINUX MARKET POS\x1b\x45\x00\n` // Bold
        ticketStr += `Autocobro Express\n`
        ticketStr += `Ticket: ${salePayload.saleNumber}\n`
        ticketStr += `Atendido por: KIOSKO\n\n`
        ticketStr += `\x1b\x61\x00` // Left align
        
        salePayload.items.forEach((c: any) => {
           ticketStr += `${c.name.substring(0, 20)}\n`
           ticketStr += `${c.quantity}x ${fmt(c.price)}  -  ${fmt(c.subtotal)}\n`
        })
        
        ticketStr += `\n--------------------------------\n`
        ticketStr += `\x1b\x61\x02` // Right align
        ticketStr += `SUBTOTAL: ${fmt(salePayload.subtotal)}\n`
        ticketStr += `IVA: ${fmt(salePayload.tax)}\n`
        ticketStr += `\x1b\x45\x01TOTAL: ${fmt(salePayload.total)}\x1b\x45\x00\n`
        
        ticketStr += `\x1b\x61\x01` // Center
        ticketStr += `\nGracias por su compra!\n`
        ticketStr += `\n\n\n\n\n\n\n\n\x1b\x6d` // Feed lines and cut

        await invoke('print_ticket', { content: ticketStr })
      } catch (hwError) {
        console.warn('[Hardware] Error enviando a impresora:', hwError)
      }
    }
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <RefreshCw className="w-12 h-12 text-primary animate-spin" />
      <p className="text-muted-foreground text-lg">Iniciando modo autocobro...</p>
    </div>
  )

  return (
    <div ref={kioskRef} className="h-screen bg-background flex flex-col overflow-hidden select-none relative" style={{ cursor: 'default' }}>
      {/* ── IDLE OVERLAY ─────────────────────────────────────── */}
      {showIdle && (
        <div 
          className="absolute inset-0 z-[1000] bg-background flex flex-col items-center justify-center p-12 overflow-hidden animate-in fade-in duration-500 cursor-pointer"
          onClick={() => setShowIdle(false)}
        >
          <div className="absolute inset-0 -z-10 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-[50%] h-[50%] rounded-full bg-primary/20 blur-[150px] animate-pulse-slow" />
            <div className="absolute bottom-1/4 right-1/4 w-[50%] h-[50%] rounded-full bg-accent/20 blur-[150px] animate-pulse-slow" />
          </div>

          <div className="max-w-4xl w-full text-center space-y-12">
             <div className="mx-auto w-48 h-48 bg-card rounded-[4rem] border border-white/5 shadow-2xl flex items-center justify-center p-6 animate-bounce">
               <img src={logoUrl} alt="Logo" className="w-full h-full object-contain drop-shadow-2xl" />
             </div>
             <div className="space-y-4">
                <h2 className="text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50">
                  ¡Hola!
                </h2>
                <p className="text-3xl font-bold text-primary uppercase tracking-[0.3em]">
                  Toca la pantalla para comenzar
                </p>
             </div>
             
             <div className="grid grid-cols-3 gap-8 pt-12 opacity-50">
                <div className="flex flex-col items-center gap-3">
                   <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center">
                     <Tag className="w-10 h-10" />
                   </div>
                   <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Productos</p>
                </div>
                <div className="flex flex-col items-center gap-3">
                   <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center">
                     <ShoppingCart className="w-10 h-10" />
                   </div>
                   <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Autocobro</p>
                </div>
                <div className="flex flex-col items-center gap-3">
                   <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center">
                     <CreditCard className="w-10 h-10" />
                   </div>
                   <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Pago Seguro</p>
                </div>
             </div>
          </div>
          
          <div className="absolute bottom-12 text-muted-foreground text-xs font-mono border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
             Linux-Market v1.2.0 · Station verified & secured
          </div>
        </div>
      )}
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="h-20 flex items-center justify-between px-8 border-b border-border bg-card/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-4">
          <img src={logoUrl} alt="Logo" className="h-12 w-12 object-contain rounded-xl shadow-lg" />
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Linux-Market</h1>
            <p className="text-sm font-bold text-primary uppercase tracking-widest">Autocobro · Escanea tus productos</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl border border-border" onClick={toggleFullscreen}>
             {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
          </Button>

          {step !== 'browse' && (
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-bold border-border rounded-2xl shadow-lg active:scale-95 transition-all"
              onClick={() => { setStep('browse'); setPayMethod(null); setCashReceived('') }}>
              <ArrowLeft className="w-6 h-6 mr-3" /> Volver
            </Button>
          )}
          {cart.length > 0 && step === 'browse' && (
            <Button size="lg" className="h-14 px-8 text-xl font-black bg-gradient-to-r from-primary to-accent rounded-2xl shadow-xl shadow-primary/30 animate-pulse-slow active:scale-95 transition-all"
              onClick={() => setStep('cart')}>
              <ShoppingCart className="w-6 h-6 mr-3" />
              Pagar {fmt(total)}
            </Button>
          )}
        </div>
      </header>

      {/* ── STEP: BROWSE ──────────────────────────────────────── */}
      {step === 'browse' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search + Categories */}
          <div className="px-8 py-4 space-y-3 shrink-0 border-b border-border bg-card/30">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar producto o escanear código de barras..."
                className="pl-12 h-14 text-lg bg-background border-border"
              />
              {search && (
                <button className="absolute right-4 top-1/2 -translate-y-1/2" onClick={() => setSearch('')}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button key={cat}
                  onClick={() => setCategory(cat)}
                  className={`shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                    category === cat
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                      : 'bg-card border border-border text-foreground hover:border-primary/50'
                  }`}>
                  {cat === 'all' ? 'Todo' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid — big touch-friendly cards */}
          <div className="flex-1 overflow-y-auto p-8">
            {filtered.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <Package className="w-20 h-20 opacity-20" />
                <p className="text-xl">Sin productos disponibles</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(product => {
                  const inCart = cart.find(c => c.product.id === product.id)
                  return (
                    <button key={product.id} onClick={() => addToCart(product)}
                      className={`relative p-5 rounded-3xl border-2 text-left transition-all duration-150 active:scale-95 ${
                        inCart
                          ? 'border-primary bg-primary/10 shadow-xl shadow-primary/20'
                          : 'border-border bg-card hover:border-primary/50 hover:bg-card/80'
                      }`}>
                      {inCart && (
                        <div className="absolute top-3 right-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-black text-white shadow-lg">
                          {inCart.quantity}
                        </div>
                      )}
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center mb-4">
                        <Tag className="w-7 h-7 text-primary" />
                      </div>
                      <div className="font-bold text-base leading-tight mb-1 line-clamp-2">{product.name}</div>
                      <div className="text-xs text-muted-foreground font-mono mb-3">{product.sku}</div>
                      <div className="flex items-end justify-between">
                        <div className="text-xl font-black text-primary">{fmt(product.price)}</div>
                        <Badge variant={product.stock <= product.minStock ? 'destructive' : 'secondary'} className="text-xs">
                          {product.stock} unid.
                        </Badge>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP: CART ────────────────────────────────────────── */}
      {step === 'cart' && (
        <div className="flex-1 flex gap-0 overflow-hidden">
          {/* Items list */}
          <div className="flex-1 overflow-y-auto p-8 space-y-3">
            <h2 className="text-2xl font-black mb-4">Tu carrito</h2>
            {cart.map(item => (
              <div key={item.product.id}
                className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Tag className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base leading-tight line-clamp-1">{item.product.name}</div>
                  <div className="text-sm text-muted-foreground font-mono">{item.product.sku}</div>
                  <div className="font-bold text-primary">{fmt(item.product.price)}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => updateQty(item.product.id, item.quantity - 1)}
                    className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center hover:bg-destructive/10 hover:border-destructive active:scale-90 transition-all">
                    {item.quantity === 1 ? <Trash2 className="w-4 h-4 text-destructive" /> : <Minus className="w-4 h-4" />}
                  </button>
                  <span className="w-8 text-center text-xl font-black">{item.quantity}</span>
                  <button onClick={() => updateQty(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock}
                    className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center hover:bg-primary/10 hover:border-primary active:scale-90 transition-all disabled:opacity-30">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-24 text-right font-black text-lg shrink-0">
                  {fmt(item.product.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* Summary panel */}
          <div className="w-96 border-l border-border bg-card flex flex-col p-6 gap-4">
            <h3 className="text-xl font-black">Resumen</h3>
            <div className="flex-1 space-y-3 text-base">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({itemCount} artículos)</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>IVA ({taxRate}%)</span>
                <span>{fmt(tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-2xl font-black">
                <span>Total</span>
                <span className="text-primary">{fmt(total)}</span>
              </div>
            </div>
            <Button size="lg" className="h-16 text-xl font-black bg-gradient-to-r from-primary to-accent shadow-xl shadow-primary/30 rounded-2xl"
              onClick={() => setStep('pay')}>
              <CreditCard className="w-6 h-6 mr-3" />
              Pagar ahora
            </Button>
            <button onClick={() => { setCart([]); setStep('browse') }}
              className="text-sm text-muted-foreground hover:text-destructive text-center">
              Cancelar y vaciar carrito
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: PAY ─────────────────────────────────────────── */}
      {step === 'pay' && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-2xl space-y-8">
            <div className="text-center">
              <div className="text-4xl font-black text-primary mb-1">{fmt(total)}</div>
              <p className="text-muted-foreground">Selecciona cómo deseas pagar</p>
            </div>

            {!payMethod ? (
              <div className="grid grid-cols-2 gap-4">
                {PAY_METHODS.map(m => (
                  <button key={m.id} onClick={() => setPayMethod(m.id)}
                    className="p-8 rounded-3xl border-2 border-border bg-card hover:border-primary/50 hover:scale-[1.02] active:scale-95 transition-all text-center space-y-3">
                    <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${m.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <m.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-xl font-bold">{m.label}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <button onClick={() => setPayMethod(null)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" /> Cambiar método
                </button>

                {payMethod === 'efectivo' && (
                  <div className="space-y-4">
                    <p className="text-center text-lg text-muted-foreground">Ingresa el monto recibido</p>
                    <Input
                      type="number"
                      value={cashReceived}
                      onChange={e => setCashReceived(e.target.value)}
                      placeholder="0.00"
                      className="text-4xl font-black text-center h-20 bg-background border-border"
                      step="0.01"
                      autoFocus
                    />
                    {parseFloat(cashReceived) > 0 && (
                      <div className={`p-5 rounded-2xl text-center border-2 ${change >= 0 ? 'border-green-500/40 bg-green-950/20' : 'border-red-500/40 bg-red-950/20'}`}>
                        <div className="text-sm text-muted-foreground mb-1">{change >= 0 ? 'Cambio a entregar' : 'Falta'}</div>
                        <div className={`text-4xl font-black ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {fmt(Math.abs(change))}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                      {[total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500].map(amt => (
                        <Button key={amt} variant="outline" size="lg" className="h-14 text-base"
                          onClick={() => setCashReceived(amt.toFixed(2))}>
                          {fmt(amt)}
                        </Button>
                      ))}
                    </div>
                    <Button size="lg" disabled={isProcessing || parseFloat(cashReceived || '0') < total}
                      onClick={handleCheckout}
                      className="w-full h-16 text-xl font-black bg-gradient-to-r from-green-600 to-green-800 rounded-2xl">
                      {isProcessing ? <RefreshCw className="w-6 h-6 animate-spin" /> : 'Confirmar pago en efectivo'}
                    </Button>
                  </div>
                )}

                {payMethod === 'tarjeta' && (
                  <div className="text-center space-y-6">
                    <div className="p-8 rounded-3xl border-2 border-blue-800/40 bg-blue-950/20 space-y-3">
                      <Monitor className="w-16 h-16 mx-auto text-blue-400" />
                      <p className="text-2xl font-bold text-blue-300">Acerca tu tarjeta al lector</p>
                      <p className="text-muted-foreground">Sigue las instrucciones de la terminal bancaria</p>
                      <div className="text-4xl font-black text-blue-400">{fmt(total)}</div>
                    </div>
                    <Button size="lg" disabled={isProcessing} onClick={handleCheckout}
                      className="w-full h-16 text-xl font-black bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl">
                      {isProcessing ? <RefreshCw className="w-6 h-6 animate-spin" /> : 'Confirmar — Pago con Tarjeta'}
                    </Button>
                  </div>
                )}

                {payMethod === 'qr' && (
                  <div className="text-center space-y-6">
                    <div className="p-8 rounded-3xl border-2 border-orange-800/40 bg-orange-950/20 space-y-3">
                      <QrCode className="w-20 h-20 mx-auto text-orange-400" />
                      <p className="text-2xl font-bold text-orange-300">Escanea el código QR</p>
                      <p className="text-muted-foreground">Usa tu app bancaria, CoDi o Mercado Pago</p>
                      <div className="text-4xl font-black text-orange-400">{fmt(total)}</div>
                    </div>
                    <Button size="lg" disabled={isProcessing} onClick={handleCheckout}
                      className="w-full h-16 text-xl font-black bg-gradient-to-r from-orange-500 to-amber-700 rounded-2xl">
                      {isProcessing ? <RefreshCw className="w-6 h-6 animate-spin" /> : 'Ya pagué — Confirmar'}
                    </Button>
                  </div>
                )}

                {payMethod === 'transferencia' && (
                  <div className="text-center space-y-6">
                    <div className="p-8 rounded-3xl border-2 border-violet-800/40 bg-violet-950/20 space-y-3">
                      <Building2 className="w-16 h-16 mx-auto text-violet-400" />
                      <p className="text-2xl font-bold text-violet-300">Transfiere al número de cuenta</p>
                      <p className="font-mono text-2xl font-black text-violet-200">{settings?.payment_clabe || 'Ver en caja'}</p>
                      <div className="text-4xl font-black text-violet-400">{fmt(total)}</div>
                    </div>
                    <Button size="lg" disabled={isProcessing} onClick={handleCheckout}
                      className="w-full h-16 text-xl font-black bg-gradient-to-r from-violet-600 to-purple-800 rounded-2xl">
                      {isProcessing ? <RefreshCw className="w-6 h-6 animate-spin" /> : 'Ya transferí — Confirmar'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP: DONE ────────────────────────────────────────── */}
      {step === 'done' && lastSale && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-8 max-w-lg">
            <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/40 animate-bounce">
              <CheckCircle className="w-16 h-16 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-green-400">¡Gracias!</h2>
              <p className="text-xl text-muted-foreground mt-2">Tu compra fue procesada exitosamente</p>
            </div>
            <div className="p-6 rounded-3xl border border-border bg-card space-y-3">
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">Total pagado</span>
                <span className="font-black text-2xl text-green-400">{fmt(lastSale.total)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Folio</span>
                <span className="font-mono">{lastSale.saleNumber}</span>
              </div>
              {payMethod === 'efectivo' && change > 0 && (
                <div className="p-4 rounded-2xl bg-green-950/30 border border-green-800/40">
                  <div className="text-sm text-muted-foreground">Tu cambio es</div>
                  <div className="text-3xl font-black text-green-400">{fmt(change)}</div>
                </div>
              )}
            </div>
            
            <div className="pt-2 animate-in slide-in-from-bottom-5 fade-in duration-500 delay-500">
               <Button onClick={() => printTicketHandler(lastSale)} variant="outline" size="lg" className="rounded-full bg-background border-border shadow-lg font-bold gap-2">
                 <RefreshCw className="w-4 h-4" /> Reimprimir Ticket
               </Button>
            </div>
            
            <p className="text-muted-foreground text-sm animate-pulse">Esta pantalla se reiniciará automáticamente...</p>
          </div>
        </div>
      )}

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="h-10 flex items-center justify-between px-8 border-t border-border bg-card/50 text-[11px] text-muted-foreground uppercase tracking-widest shrink-0">
        <span>Linux-Market · Modo Autocobro</span>
        <span>Atendido por: {user?.name || '—'}</span>
        <span>v1.2.0-PRO · {new Date().toLocaleDateString('es-MX')}</span>
      </footer>
    </div>
  )
}
