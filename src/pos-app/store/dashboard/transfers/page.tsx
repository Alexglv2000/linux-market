'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/lib/auth-context'
import { useRealtime } from '@/hooks/use-realtime'
import { transfersApi, sucursalesApi } from '@/lib/api'
import { Plus, ArrowLeftRight, Package, Search, CheckCircle, XCircle, Clock, Truck, Printer, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function TransfersPage() {
  const { user } = useAuth()
  const { products, transfers } = useRealtime()
  
  const [sucursales, setSucursales] = useState<any[]>([])
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])
  const [fromSucursal, setFromSucursal] = useState('')
  const [toSucursal, setToSucursal] = useState('')
  const [purchaseId, setPurchaseId] = useState('')
  const [notes, setNotes] = useState('')

  const loadData = async () => {
    try {
      const sucs = await sucursalesApi.getAll()
      setSucursales(sucs)
    } catch {}
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filter products
  const availableProducts = products?.filter(p => p.isActive && p.stock > 0) || []
  const filteredProducts = availableProducts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addProductToTransfer = (product: any) => {
    const existing = selectedProducts.find(p => p.productId === product.id)
    if (existing) {
      toast.error('Producto ya agregado')
      return
    }
    setSelectedProducts([...selectedProducts, {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      quantity: 1
    }])
    toast.success('Producto agregado')
  }

  const updateQuantity = (productId: number, quantity: number) => {
    const product = products?.find(p => p.id === productId)
    if (product && quantity > product.stock) {
      toast.error('Cantidad mayor al stock disponible')
      return
    }
    
    setSelectedProducts(selectedProducts.map(p =>
      p.productId === productId ? { ...p, quantity: Math.max(1, quantity) } : p
    ))
  }

  const removeProduct = (productId: number) => {
    setSelectedProducts(selectedProducts.filter(p => p.productId !== productId))
  }

  const createTransfer = async () => {
    if (!fromSucursal || !toSucursal) {
      toast.error('Selecciona sucursales de origen y destino')
      return
    }

    if (fromSucursal === toSucursal) {
      toast.error('Las sucursales deben ser diferentes')
      return
    }

    if (selectedProducts.length === 0) {
      toast.error('Agrega al menos un producto')
      return
    }

    try {
      const transferNumber = `TRF-${Date.now()}`
      await transfersApi.create({
        transferNumber,
        fromSucursalId: fromSucursal,
        toSucursalId: toSucursal,
        purchaseId,
        userId: user!.id,
        status: 'pendiente',
        items: selectedProducts,
        notes
      })

      toast.success('Transferencia creada exitosamente')
      setIsDialogOpen(false)
      resetForm()
      loadData()
    } catch (error: any) {
      toast.error('Error al crear la transferencia: ' + error.message)
    }
  }

  const resetForm = () => {
    setSelectedProducts([])
    setFromSucursal('')
    setToSucursal('')
    setPurchaseId('')
    setNotes('')
    setSearchTerm('')
  }

  const printTransferTicket = (transfer: any) => {
    const doc = new jsPDF({ format: [80, 150], unit: 'mm' })
    doc.setFontSize(12)
    doc.text('TICKET DE TRANSFERENCIA', 40, 10, { align: 'center' })
    doc.setFontSize(8)
    doc.text('Linux Market POS', 40, 15, { align: 'center' })
    
    doc.text(`Folio: ${transfer.transferNumber}`, 5, 25)
    doc.text(`Compra Ref: ${transfer.purchaseId || 'N/A'}`, 5, 30)
    doc.text(`Fecha: ${new Date(transfer.createdAt).toLocaleString()}`, 5, 35)
    doc.text(`Origen: ${transfer.fromSucursalId}`, 5, 40)
    doc.text(`Destino: ${transfer.toSucursalId}`, 5, 45)
    doc.line(5, 48, 75, 48)
    
    ;(doc as any).autoTable({
      startY: 50,
      margin: { left: 5, right: 5 },
      head: [['Prod', 'Cant']],
      body: transfer.items.map((i: any) => [i.name.substring(0, 15), i.quantity]),
      theme: 'plain',
      styles: { fontSize: 7 }
    })

    doc.text('--------------------------------', 40, (doc as any).lastAutoTable.finalY + 5, { align: 'center' })
    doc.text('Firma Almacén', 40, (doc as any).lastAutoTable.finalY + 15, { align: 'center' })

    const pdfBlob = doc.output('bloburl')
    window.open(pdfBlob, '_blank')
  }

  const updateTransferStatus = async (transfer: any, newStatus: string) => {
    try {
      await transfersApi.updateStatus(transfer.id, newStatus)
      if (newStatus === 'completada') printTransferTicket(transfer)
      toast.success(`Transferencia ${newStatus}`)
      loadData()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  const pendingTransfers = transfers.filter(t => t.status === 'pendiente')
  const inTransitTransfers = transfers.filter(t => t.status === 'en_transito')
  const completedTransfers = transfers.filter(t => t.status === 'completada')

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight">Transferencias</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Movimientos de inventario entre sucursales
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 h-11 px-5 rounded-xl font-bold shadow-xl shadow-primary/20 bg-primary hover:opacity-90 active:scale-95 transition-all">
              <Plus className="w-5 h-5" />
              Nueva Transferencia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Transferencia</DialogTitle>
              <DialogDescription>
                Crea una transferencia de productos entre sucursales
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sucursal Origen</Label>
                  <Select value={fromSucursal} onValueChange={setFromSucursal}>
                    <SelectTrigger><SelectValue placeholder="Selecciona origen" /></SelectTrigger>
                    <SelectContent>
                      {sucursales.map(s => <SelectItem key={s.id} value={s.code}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sucursal Destino</Label>
                  <Select value={toSucursal} onValueChange={setToSucursal}>
                    <SelectTrigger><SelectValue placeholder="Selecciona destino" /></SelectTrigger>
                    <SelectContent>
                      {sucursales.map(s => <SelectItem key={s.id} value={s.code}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>ID de Compra / Referencia (Opcional)</Label>
                <div className="flex gap-2">
                  <Input placeholder="Ej: COMP-001" value={purchaseId} onChange={e => setPurchaseId(e.target.value)} />
                  <div className="px-3 bg-indigo-50 text-indigo-700 flex items-center rounded-md border border-indigo-100">
                    <Info className="w-4 h-4 mr-2" />
                    <span className="text-[10px] font-medium">Asociar con orden externa</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Buscar Productos</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar por nombre o SKU..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
              </div>

              <div className="border border-white/10 rounded-2xl p-4 max-h-48 overflow-y-auto bg-muted/10">
                <div className="grid grid-cols-2 gap-2">
                  {filteredProducts.slice(0, 10).map(product => (
                    <Button key={product.id} variant="outline" className="justify-start h-auto py-2.5 rounded-xl border-white/10 hover:border-primary/30" onClick={() => addProductToTransfer(product)}>
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku} &middot; Stock: {product.stock}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Productos Seleccionados ({selectedProducts.length})</Label>
                {selectedProducts.length === 0 ? (
                  <div className="border border-white/10 rounded-2xl p-6 text-center text-muted-foreground bg-muted/10">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Sin productos seleccionados</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedProducts.map(item => (
                      <div key={item.productId} className="flex items-center gap-3 p-3 border border-white/10 rounded-xl bg-card/50">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                        </div>
                        <Input type="number" min="1" value={item.quantity} onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)} className="w-20 h-9 text-center font-mono border-white/10" />
                        <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => removeProduct(item.productId)}><XCircle className="w-4 h-4" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Input placeholder="Opcional..." value={notes} onChange={e => setNotes(e.target.value)} className="border-white/10" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl border-white/10">Cancelar</Button>
              <Button onClick={createTransfer} className="rounded-xl bg-primary font-bold shadow-lg shadow-primary/20">Crear Transferencia</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Pendientes', value: pendingTransfers.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'En Tránsito', value: inTransitTransfers.length, icon: Truck, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Completadas', value: completedTransfers.length, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Total', value: transfers.length, icon: ArrowLeftRight, color: 'text-primary', bg: 'bg-primary/10' },
        ].map(stat => (
          <Card key={stat.label} className="card-hover border-white/5 bg-card/50 backdrop-blur overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</CardTitle>
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tighter">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="transit">En Tránsito</TabsTrigger>
          <TabsTrigger value="completed">Completadas</TabsTrigger>
        </TabsList>
        <TabsContent value="all"><TransfersTable transfers={transfers} onUpdateStatus={updateTransferStatus} sucursales={sucursales} /></TabsContent>
        <TabsContent value="pending"><TransfersTable transfers={pendingTransfers} onUpdateStatus={updateTransferStatus} sucursales={sucursales} /></TabsContent>
        <TabsContent value="transit"><TransfersTable transfers={inTransitTransfers} onUpdateStatus={updateTransferStatus} sucursales={sucursales} /></TabsContent>
        <TabsContent value="completed"><TransfersTable transfers={completedTransfers} onUpdateStatus={updateTransferStatus} sucursales={sucursales} /></TabsContent>
      </Tabs>
    </div>
  )
}

function TransfersTable({ transfers, onUpdateStatus, sucursales }: any) {
  const getStatusBadge = (status: string) => {
    const variants: any = { pendiente: { variant: 'secondary', icon: Clock }, en_transito: { variant: 'default', icon: Truck }, completada: { variant: 'default', icon: CheckCircle }, cancelada: { variant: 'destructive', icon: XCircle } }
    const config = variants[status] || variants.pendiente
    const Icon = config.icon
    return <Badge variant={config.variant} className="gap-1"><Icon className="w-3 h-3" />{status.replace('_', ' ')}</Badge>
  }

  const getSucursalName = (code: string) => sucursales.find((s:any) => s.code === code)?.name || code

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transferencias</CardTitle>
        <CardDescription>{transfers.length} transferencia(s)</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Número</TableHead><TableHead>Origen</TableHead><TableHead>Destino</TableHead><TableHead>Productos</TableHead><TableHead>Estado</TableHead><TableHead>Fecha</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {transfers.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Sin transferencias</TableCell></TableRow> : transfers.map((t: any) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-sm">{t.transferNumber}</TableCell>
                <TableCell>{getSucursalName(t.fromSucursalId)}</TableCell>
                <TableCell>{getSucursalName(t.toSucursalId)}</TableCell>
                <TableCell><Badge variant="outline">{t.items.length} productos</Badge></TableCell>
                <TableCell>{getStatusBadge(t.status)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(t.createdAt).toLocaleDateString('es-ES')}</TableCell>
                <TableCell className="text-right">
                  {t.status === 'pendiente' && <Button size="sm" onClick={() => onUpdateStatus(t, 'en_transito')}>Enviar</Button>}
                  {t.status === 'en_transito' && <Button size="sm" onClick={() => onUpdateStatus(t, 'completada')}>Completar</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
