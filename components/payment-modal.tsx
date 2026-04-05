'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { accountsApi } from '@/lib/api'
import { useEffect } from 'react'
import {
  CreditCard, Banknote, Smartphone, Building2,
  CheckCircle, Loader2, Copy, QrCode, ArrowLeft,
  AlertTriangle, ShieldCheck, Landmark, Monitor
} from 'lucide-react'
import { useSettings } from '@/lib/settings-context'

type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'qr'

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  total: number
  onConfirm: (method: PaymentMethod, reference?: string) => void
}

const METHODS = [
  { id: 'tarjeta' as PaymentMethod, label: 'Tarjeta', icon: CreditCard, desc: 'Crédito o débito', gradient: 'from-blue-600 to-blue-800' },
  { id: 'efectivo' as PaymentMethod, label: 'Efectivo', icon: Banknote, desc: 'Pago en mostrador', gradient: 'from-green-600 to-green-800' },
  { id: 'transferencia' as PaymentMethod, label: 'Transferencia', icon: Building2, desc: 'SPEI / CLABE', gradient: 'from-violet-600 to-purple-800' },
  { id: 'qr' as PaymentMethod, label: 'QR / CoDi', icon: QrCode, desc: 'Escanea y paga', gradient: 'from-orange-500 to-amber-700' },
]

export function PaymentModal({ open, onClose, total, onConfirm }: PaymentModalProps) {
  const [step, setStep] = useState<'select' | 'process' | 'done'>('select')
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [cashReceived, setCashReceived] = useState('')
  const [cardLast4, setCardLast4] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [reference, setReference] = useState('')
  const [terminalVerified, setTerminalVerified] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)
  const [accounts, setAccounts] = useState<any[]>([])
  const { settings } = useSettings()

  useEffect(() => {
    accountsApi.getAll().then(setAccounts).catch(() => {})
  }, [])

  const clabe = settings?.payment_clabe || '000000000000000000'
  const beneficiary = settings?.payment_beneficiary || 'Negocio'
  const bank = settings?.payment_bank || 'Banco'

  const change = parseFloat(cashReceived || '0') - total

  const handleMethodSelect = (m: PaymentMethod) => {
    setMethod(m)
    setStep('process')
  }

  const handleProcess = async () => {
    setIsProcessing(true)
    // Simulate processing delay (replace with actual payment gateway)
    await new Promise(r => setTimeout(r, 1500))
    const ref = `REF-${Date.now().toString(36).toUpperCase()}`
    setReference(ref)
    setIsProcessing(false)
    setStep('done')
  }

  const handleConfirm = () => {
    onConfirm(method!, reference)
    resetModal()
  }

  const resetModal = () => {
    setStep('select')
    setMethod(null)
    setCashReceived('')
    setCardLast4('')
    setReference('')
  }

  const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { onClose(); resetModal() } }}>
      <DialogContent className="max-w-lg border-white/10 bg-card/95 backdrop-blur">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Procesar pago</span>
            <Badge className="text-lg px-4 py-1.5 bg-gradient-to-r from-primary to-accent text-white font-black">
              {fmt(total)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* STEP 1: SELECT METHOD */}
        {step === 'select' && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Selecciona el método de pago:</p>
            <div className="grid grid-cols-2 gap-3">
              {METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => handleMethodSelect(m.id)}
                  className="group p-4 rounded-2xl border border-white/10 bg-background/30 hover:border-primary/50 hover:bg-primary/5 transition-all text-left hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className={`w-10 h-10 bg-gradient-to-br ${m.gradient} rounded-xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                    <m.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="font-semibold text-sm">{m.label}</div>
                  <div className="text-xs text-muted-foreground">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: PROCESS */}
        {step === 'process' && method && (
          <div className="space-y-5 pt-2">
            <button onClick={() => setStep('select')} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Cambiar método
            </button>

            {/* CARD / TERMINAL */}
            {method === 'tarjeta' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-800/30 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-blue-300">Seguridad Bancaria Activada</p>
                    <p className="text-muted-foreground leading-relaxed">Verifica que la terminal física muestre &quot;APROBADA&quot; y el folio coincida.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs">Seleccionar Terminal</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {accounts.filter(a => a.type === 'terminal').map(acc => (
                      <button 
                        key={acc.id}
                        onClick={() => setSelectedAccountId(acc.id!)}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all text-xs ${selectedAccountId === acc.id ? 'border-primary bg-primary/10' : 'border-white/10 bg-background/50'}`}
                      >
                         <div className="flex items-center gap-2">
                           <Monitor className="w-3.5 h-3.5" />
                           <span className="font-semibold">{acc.name}</span>
                         </div>
                         <span className="text-[10px] opacity-50">{acc.identifier}</span>
                      </button>
                    ))}
                    {accounts.filter(a => a.type === 'terminal').length === 0 && (
                      <p className="text-[10px] text-muted-foreground italic">No hay terminales registradas en Configuración.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Número de Folio / Autorización</Label>
                  <Input
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    placeholder="Ej: 001234"
                    className="font-mono text-center h-10 bg-background/50 border-white/10"
                  />
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 cursor-pointer" onClick={() => setTerminalVerified(!terminalVerified)}>
                  <input type="checkbox" checked={terminalVerified} onChange={() => {}} className="mt-1" />
                  <span className="text-[11px] text-amber-200/80 leading-tight">
                    Confirmo que el pago fue procesado exitosamente en la terminal física.
                  </span>
                </div>

                <Button 
                  onClick={handleProcess} 
                  disabled={isProcessing || !terminalVerified || (accounts.some(a => a.type === 'terminal') && !selectedAccountId)} 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:opacity-90 h-12"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CreditCard className="w-4 h-4 mr-2" /> Confirmar en Sistema</>}
                </Button>
              </div>
            )}

            {/* CASH */}
            {method === 'efectivo' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Efectivo recibido</Label>
                  <Input
                    type="number"
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
                    placeholder="0.00"
                    className="font-mono text-2xl h-14 text-center bg-background/50 border-white/10"
                    step="0.01"
                  />
                </div>
                {parseFloat(cashReceived) > 0 && (
                  <div className={`p-4 rounded-xl border ${change >= 0 ? 'border-green-800/40 bg-green-950/20' : 'border-red-800/40 bg-red-950/20'}`}>
                    <div className="text-xs text-muted-foreground mb-1">Cambio a entregar</div>
                    <div className={`text-2xl font-black ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(Math.abs(change))}</div>
                    {change < 0 && <div className="text-xs text-red-400 mt-1">Falta {fmt(Math.abs(change))}</div>}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  {[total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500].map(amt => (
                    <Button key={amt} variant="outline" size="sm" className="border-white/10 font-mono text-xs" onClick={() => setCashReceived(amt.toFixed(2))}>
                      {fmt(amt)}
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={handleProcess}
                  disabled={isProcessing || parseFloat(cashReceived || '0') < total}
                  className="w-full bg-gradient-to-r from-green-600 to-green-800 hover:opacity-90 h-12"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Banknote className="w-4 h-4 mr-2" /> Confirmar pago</>}
                </Button>
              </div>
            )}

            {/* TRANSFER / CLABE */}
            {method === 'transferencia' && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl border border-violet-800/40 bg-violet-950/20 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-violet-400" /> Datos de Recepción</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {accounts.filter(a => a.type === 'banco').length === 0 ? (
                      <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5 space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest">
                          <span>Cuenta Concentradora</span>
                          <Badge variant="outline" className="text-[9px] h-4 border-violet-500/50 text-violet-400">SPEI</Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground">Beneficiario</p>
                          <p className="font-bold text-sm text-violet-200">{beneficiary}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground">Banco</p>
                            <p className="font-bold text-sm text-violet-200">{bank}</p>
                          </div>
                          <div className="space-y-1 text-right">
                            <p className="text-[10px] text-muted-foreground">CLABE</p>
                            <p className="font-mono font-bold text-sm text-violet-200">{clabe}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      accounts.filter(a => a.type === 'banco').map(acc => (
                        <button 
                          key={acc.id}
                          onClick={() => setSelectedAccountId(acc.id!)}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all text-xs ${selectedAccountId === acc.id ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 bg-background/50'}`}
                        >
                           <div className="flex items-center gap-2 text-left">
                             <Landmark className="w-3.5 h-3.5 text-violet-400" />
                             <div>
                               <p className="font-semibold">{acc.name}</p>
                               <p className="text-[9px] opacity-70">{acc.bank} • {acc.identifier}</p>
                             </div>
                           </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                   <Label className="text-xs">Número de Rastreo / Folio SPEI</Label>
                   <Input
                     value={reference}
                     onChange={e => setReference(e.target.value)}
                     placeholder="Ej: 998877"
                     className="font-mono text-center h-10 bg-background/50 border-white/10"
                   />
                </div>
                <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20 flex gap-2 items-start">
                   <AlertTriangle className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                   <p className="text-[10px] text-muted-foreground italic">Por favor, confirma en tu app bancaria que los {fmt(total)} hayan ingresado antes de liberar el ticket.</p>
                </div>
                <Button onClick={handleProcess} disabled={isProcessing || !reference} className="w-full bg-gradient-to-r from-violet-600 to-purple-800 hover:opacity-90 h-12">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar transferencia recibida'}
                </Button>
              </div>
            )}

            {/* QR */}
            {method === 'qr' && (
              <div className="space-y-4 text-center">
                <div className="p-6 rounded-2xl border border-orange-800/40 bg-orange-950/20 flex flex-col items-center gap-4">
                  <QrCode className="w-16 h-16 text-orange-400" />
                  <div>
                    <div className="font-semibold">Código QR de pago</div>
                    <div className="text-xs text-muted-foreground mt-1">Muestra este QR al cliente para pago con CoDi, PayPal, Mercado Pago u otras apps</div>
                  </div>
                  <div className="text-3xl font-black text-orange-400">{fmt(total)}</div>
                </div>
                <Button onClick={handleProcess} disabled={isProcessing} className="w-full bg-gradient-to-r from-orange-500 to-amber-700 hover:opacity-90 h-12">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar pago por QR'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: DONE */}
        {step === 'done' && (
          <div className="text-center space-y-5 py-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shadow-2xl shadow-green-500/30">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-green-400">Pago exitoso</h3>
              <p className="text-muted-foreground text-sm mt-1">{fmt(total)} — {METHODS.find(m => m.id === method)?.label}</p>
            </div>
            <div className="p-3 bg-muted/20 rounded-xl border border-white/10">
              <div className="text-xs text-muted-foreground mb-1">Referencia de pago</div>
              <div className="font-mono font-bold text-sm">{reference}</div>
            </div>
            {method === 'efectivo' && change > 0 && (
              <div className="p-4 bg-green-950/20 border border-green-800/40 rounded-xl">
                <div className="text-xs text-muted-foreground mb-1">Cambio a entregar</div>
                <div className="text-3xl font-black text-green-400">{fmt(change)}</div>
              </div>
            )}
            <Button onClick={handleConfirm} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 h-12">
              Completar venta
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
