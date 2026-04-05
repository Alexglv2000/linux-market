'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { MonitorSmartphone, Printer, QrCode, Wifi, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export function HardwareDetector() {
  const [scanning, setScanning] = useState(false)
  const [devices, setDevices] = useState<{ id: string; name: string; type: 'printer' | 'scanner' | 'terminal'; status: 'connected' | 'disconnected' }[]>([])

  const scanDevices = async () => {
    setScanning(true)
    setDevices([])
    
    // Simulate searching for devices
    await new Promise(r => setTimeout(r, 1500))

    const foundDevices = []

    // 1. Check for USB barcode scanners (HID)
    try {
      if ('usb' in navigator) {
        // Just mock seeing HID keyboard equivalents since actual scanner is an HID
        foundDevices.push({ id: 'HID-1', name: 'Lector de Código de Barras (USB)', type: 'scanner', status: 'connected' })
      } else {
        foundDevices.push({ id: 'HID-unknown', name: 'Lector Genérico (Teclado)', type: 'scanner', status: 'connected' })
      }
    } catch { }

    // 2. Mock for POS Printer if window.print exists
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      foundDevices.push({ id: 'PRN-SYS', name: 'Impresora Térmica del Sistema (OS)', type: 'printer', status: 'connected' })
    }

    // 3. Mock Payment Terminal
    foundDevices.push({ id: 'TERM-01', name: 'Terminal Smart POS (Bluetooth/Red)', type: 'terminal', status: 'connected' })

    setDevices(foundDevices as any)
    setScanning(false)
    toast.success('Escaneo de periféricos completado.')
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded-xl shrink-0" title="Detectar Dispositivos">
          <MonitorSmartphone className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MonitorSmartphone className="w-5 h-5 text-primary" />
            Hardware y Periféricos
          </DialogTitle>
          <DialogDescription>
            Detecta impresoras térmicas, lectores de barras y terminales de pago conectadas al punto de venta.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {devices.length === 0 && !scanning ? (
            <div className="text-center py-6 border-2 border-dashed rounded-xl bg-muted/20">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No se han detectado dispositivos aún.</p>
            </div>
          ) : scanning ? (
            <div className="text-center py-6 border-2 border-dashed border-primary/20 rounded-xl bg-primary/5">
              <RefreshCw className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
              <p className="text-sm font-medium text-primary animate-pulse">Buscando dispositivos USB/Red...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {d.type === 'printer' && <Printer className="w-4 h-4" />}
                      {d.type === 'scanner' && <QrCode className="w-4 h-4" />}
                      {d.type === 'terminal' && <Wifi className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{d.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">ID: {d.id}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button onClick={scanDevices} disabled={scanning} className="gap-2 w-full sm:w-auto">
            <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Escaneando...' : 'Escanear Ahora'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
