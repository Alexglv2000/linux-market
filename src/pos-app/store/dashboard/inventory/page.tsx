'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/lib/auth-context'
import { productsApi } from '@/lib/api'
import { useRealtimeProducts } from '@/hooks/use-realtime'
import {
  Plus, Search, Edit, Trash2, Package, AlertTriangle,
  QrCode, Printer, FileUp, FileDown, Wifi, WifiOff,
  RefreshCw, ScanLine, CheckCircle2, X, Save,
  LayoutGrid, List, Filter, ShoppingBag, Tag
} from 'lucide-react'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { useScanner } from '@/hooks/use-scanner'
import { useCurrency } from '@/hooks/use-currency'

type FormData = {
  sku: string; name: string; description: string; category: string
  price: string; cost: string; stock: string; minStock: string
}

const EMPTY_FORM: FormData = { sku: '', name: '', description: '', category: '', price: '', cost: '', stock: '', minStock: '' }

export default function InventoryPage() {
  const { user } = useAuth()
  const { products, connected, loading, refresh } = useRealtimeProducts()
  const { formatCurrency: fmt } = useCurrency()

  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)
  const [scanMode, setScanMode] = useState(false)
  const [scanResult, setScanResult] = useState<string>('')
  const [quickStockId, setQuickStockId] = useState<number | null>(null)
  const [quickStockValue, setQuickStockValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'gallery'>('table')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const skuRef = useRef<HTMLInputElement>(null)
  const barcodeRef = useRef<HTMLInputElement>(null)
  // Auto-focus SKU en diálogo
  useEffect(() => {
    if (isDialogOpen) setTimeout(() => skuRef.current?.focus(), 100)
  }, [isDialogOpen])

  // ── Escáner de código de barras global (vía hook universal) ──────────────────────
  useScanner((product, rawCode) => {
    setScanResult(rawCode)
    if (product) {
      toast.success(`✅ Producto encontrado: ${product.name}`)
      openEditDialog(product)
    } else {
      toast.info(`📦 Código nuevo: ${rawCode} — Abre formulario para registrarlo`)
      setFormData({ ...EMPTY_FORM, sku: rawCode })
      setEditingProduct(null)
      setIsDialogOpen(true)
    }
  }, scanMode)

  // Filtrado
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  const categories = ['all', ...Array.from(new Set(products.map((p: any) => p.category)))]

  const openEditDialog = (product: any) => {
    setEditingProduct(product)
    setFormData({
      sku: product.sku, name: product.name, description: product.description || '',
      category: product.category || '', price: product.price.toString(),
      cost: product.cost.toString(), stock: product.stock.toString(), minStock: product.minStock.toString()
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => { setFormData(EMPTY_FORM); setEditingProduct(null) }

  const saveProduct = async () => {
    if (!formData.sku || !formData.name || !formData.price || !formData.stock) {
      toast.error('Completa los campos obligatorios: SKU, Nombre, Precio, Stock')
      return
    }
    setSaving(true)
    try {
      const productData = {
        sku: formData.sku, name: formData.name, description: formData.description,
        category: formData.category || 'General',
        price: parseFloat(formData.price), cost: parseFloat(formData.cost) || 0,
        stock: parseInt(formData.stock), minStock: parseInt(formData.minStock) || 5,
        sucursalId: user?.sucursalId || 'SUC001', celulaId: user?.celulaId || 'CEL001',
      }
      if (editingProduct?.id) {
        await productsApi.update(editingProduct.id, productData)
        toast.success(`✅ ${productData.name} actualizado`)
      } else {
        await productsApi.create(productData)
        toast.success(`✅ ${productData.name} creado`)
      }
      setIsDialogOpen(false)
      resetForm()
    } catch (e: any) {
      toast.error(`Error: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Ajuste rápido de stock inline
  const saveQuickStock = async (id: number) => {
    const newStock = parseInt(quickStockValue)
    if (isNaN(newStock) || newStock < 0) { toast.error('Stock inválido'); return }
    try {
      await productsApi.updateStock(id, newStock)
      toast.success('Stock actualizado')
      setQuickStockId(null)
    } catch (e: any) { toast.error(e.message) }
  }

  const deleteProduct = async (product: any) => {
    if (!confirm(`¿Eliminar "${product.name}"?`)) return
    try {
      await productsApi.delete(product.id)
      toast.success('Producto eliminado')
    } catch (e: any) { toast.error(e.message) }
  }

  // Export PDF
  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18); doc.text('Inventario — Linux Market', 14, 20)
    doc.setFontSize(10); doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 14, 28)
    // @ts-ignore
    doc.autoTable({ startY: 35, head: [['SKU', 'Nombre', 'Categoría', 'Precio', 'Stock']], body: filteredProducts.map(p => [p.sku, p.name, p.category, fmt(p.price), p.stock]), theme: 'striped', headStyles: { fillColor: [99, 102, 241] } })
    doc.save(`inventario_${Date.now()}.pdf`)
    toast.success('PDF generado')
  }

  // Export CSV
  const exportToCSV = () => {
    if (!filteredProducts.length) { toast.error('Sin productos'); return }
    const csv = 'SKU,Nombre,Categoria,Precio,Costo,Stock,StockMin\n' +
      filteredProducts.map(p => `"${p.sku}","${p.name}","${p.category}","${p.price}","${p.cost}","${p.stock}","${p.minStock}"`).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `inventario_${Date.now()}.csv`
    a.click()
    toast.success('CSV exportado')
  }

  // Import CSV
  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split('\n').slice(1).filter(l => l.trim())
    const products = lines.map(line => {
      const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim())
      const [sku, name, category, price, cost, stock, minStock] = cols
      return { sku, name, category: category || 'General', price: parseFloat(price) || 0, cost: parseFloat(cost) || 0, stock: parseInt(stock) || 0, minStock: parseInt(minStock) || 5 }
    }).filter(p => p.sku && p.name)

    if (!products.length) { toast.error('Archivo vacío o formato incorrecto'); return }
    try {
      const result = await productsApi.bulkImport(products)
      toast.success(`Importación: ${result.added} nuevos, ${result.updated} actualizados`)
    } catch (e: any) { toast.error(e.message) }
  }

  const downloadTemplate = () => {
    const csv = 'SKU,Nombre,Categoria,Precio,Costo,Stock,StockMin\nLNM-001,Laptop Linux Pro,Hardware,25000,18000,10,2\nLNM-002,Mouse Tux,Hardware,500,200,50,5'
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'plantilla_inventario.csv'
    a.click()
  }

  // Stats
  const totalProducts = products.length
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length
  const totalValue = products.reduce((s, p) => s + (p.price * p.stock), 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-indigo-950 dark:text-indigo-50">Inventario</h1>
            <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${connected ? 'text-green-500' : 'text-amber-500'}`}>
              {connected ? <><Wifi className="w-3 h-3" /> Red Operativa</> : <><WifiOff className="w-3 h-3" /> Desconectado</>}
              <div className="h-2 w-2 rounded-full bg-current animate-pulse ml-1" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex bg-muted/50 p-1 rounded-xl border border-white/5 mr-2">
               <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="sm" className="h-8 rounded-lg px-3" onClick={() => setViewMode('table')}>
                 <List className="w-4 h-4 mr-1.5" /> Lista
               </Button>
               <Button variant={viewMode === 'gallery' ? 'secondary' : 'ghost'} size="sm" className="h-8 rounded-lg px-3" onClick={() => setViewMode('gallery')}>
                 <LayoutGrid className="w-4 h-4 mr-1.5" /> Galería
               </Button>
            </div>
            
            <Button
              className={`gap-2 rounded-xl px-5 font-bold shadow-lg transition-all active:scale-95 ${scanMode ? 'bg-green-600 hover:bg-green-700 animate-pulse' : 'bg-primary hover:opacity-90 shadow-primary/20'}`}
              onClick={() => { setScanMode(!scanMode); setScanResult('') }}
            >
              <ScanLine className="w-4 h-4" />
              {scanMode ? 'Escáner Activo' : 'Cód. Barras'}
            </Button>
            
            <Button variant="outline" className="rounded-xl border-white/10 gap-2 font-bold" onClick={() => { resetForm(); setIsDialogOpen(true) }}>
              <Plus className="w-5 h-5 text-primary" /> Nuevo
            </Button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card/30 backdrop-blur-sm p-4 rounded-2xl border border-white/5">
           <div className="flex-1 flex gap-3 w-full max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar producto, SKU o marca..." value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-11 bg-background/50 border-white/10 rounded-xl" />
              </div>
              <Button variant="outline" size="icon" onClick={refresh} className="h-11 w-11 shrink-0 rounded-xl border-white/10">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
           </div>
           
           <div className="flex gap-2 shrink-0">
             <Button variant="ghost" size="sm" className="h-11 text-xs px-4" onClick={exportToPDF}>
               <Printer className="w-4 h-4 mr-2 opacity-50" /> PDF
             </Button>
             <Button variant="ghost" size="sm" className="h-11 text-xs px-4" onClick={exportToCSV}>
               <FileDown className="w-4 h-4 mr-2 text-green-500 opacity-50" /> CSV
             </Button>
             <div className="relative">
                <Button variant="ghost" size="sm" className="h-11 text-xs px-4">
                  <FileUp className="w-4 h-4 mr-2 text-primary opacity-50" /> Importar
                </Button>
                <input type="file" accept=".csv" onChange={handleCSVImport} className="absolute inset-0 opacity-0 cursor-pointer" />
             </div>
           </div>
        </div>

        {/* Category Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
           {categories.map(cat => (
             <button
               key={cat}
               onClick={() => setCategoryFilter(cat)}
               className={`shrink-0 px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                 categoryFilter === cat
                   ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                   : 'bg-card border border-white/5 text-muted-foreground hover:border-primary/30'
               }`}
             >
               {cat === 'all' ? 'Ver Todo' : cat}
             </button>
           ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalProducts}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Valor del Inventario</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(totalValue)}</div></CardContent>
        </Card>
        <Card className={lowStockCount > 0 ? 'border-destructive/50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Stock Bajo / Crítico</CardTitle>
            <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-destructive' : ''}`}>{lowStockCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      {viewMode === 'table' ? (
        <Card className="border-white/5 bg-card/50 backdrop-blur rounded-2xl overflow-hidden shadow-2xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-6">SKU</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Producto</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Categoría</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Precio</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Costo</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center w-32">Stock</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-20 text-muted-foreground">
                      {loading ? <RefreshCw className="w-8 h-8 animate-spin mx-auto opacity-20" /> : (
                        <div className="space-y-2">
                           <ShoppingBag className="w-12 h-12 mx-auto opacity-10" />
                           <p className="text-sm font-medium">No se encontraron productos</p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.map(product => (
                  <TableRow key={product.id} className={`border-white/5 group ${product.stock <= product.minStock ? 'bg-destructive/5' : ''}`}>
                    <TableCell className="pl-6 font-mono text-xs font-bold text-primary">{product.sku}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-bold text-sm">{product.name}</p>
                        {product.description && <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter border-white/10">{product.category || '—'}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-black">{fmt(product.price)}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">{fmt(product.cost)}</TableCell>
                    <TableCell className="text-center">
                      {quickStockId === product.id ? (
                        <div className="flex items-center gap-1 justify-center">
                          <Input
                            type="number" value={quickStockValue}
                            onChange={e => setQuickStockValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveQuickStock(product.id); if (e.key === 'Escape') setQuickStockId(null) }}
                            className="h-8 w-20 text-center font-mono text-sm bg-background/50 border-primary/30"
                            autoFocus min={0}
                          />
                          <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700 rounded-lg shadow-lg shadow-green-600/20" onClick={() => saveQuickStock(product.id)}>
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          className="group/btn flex items-center gap-1.5 justify-center mx-auto"
                          onClick={() => { setQuickStockId(product.id); setQuickStockValue(product.stock.toString()) }}
                        >
                          <Badge
                            variant={product.stock <= 0 ? 'destructive' : product.stock <= product.minStock ? 'destructive' : 'secondary'}
                            className={`text-xs font-black min-w-[3rem] justify-center transition-all cursor-pointer group-hover/btn:scale-110 ${product.stock <= product.minStock && product.stock > 0 ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : ''}`}
                          >
                            {product.stock}
                          </Badge>
                          {product.stock <= product.minStock && product.stock > 0 && (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                          )}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => openEditDialog(product)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => deleteProduct(product)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* Gallery View */
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
           {filteredProducts.length === 0 ? (
              <div className="col-span-full py-20 text-center space-y-3 opacity-20">
                 <Package className="w-16 h-16 mx-auto" />
                 <p className="font-bold uppercase tracking-widest text-xs">Sin productos disponibles</p>
              </div>
           ) : filteredProducts.map(product => (
             <Card key={product.id} className={`group cursor-default card-hover border-white/5 bg-card/30 backdrop-blur-sm overflow-hidden relative ${product.stock <= product.minStock ? 'ring-1 ring-destructive/30' : ''}`}>
                <div className="aspect-square bg-muted/30 flex items-center justify-center relative overflow-hidden group-hover:bg-muted/50 transition-colors">
                   <div className="absolute top-2 right-2 flex flex-col gap-1 z-10 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      <Button size="icon" variant="secondary" className="h-8 w-8 rounded-lg shadow-xl" onClick={() => openEditDialog(product)}>
                         <Edit className="w-3.5 h-3.5 text-primary" />
                      </Button>
                      <Button size="icon" variant="secondary" className="h-8 w-8 rounded-lg shadow-xl text-destructive" onClick={() => deleteProduct(product)}>
                         <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                   </div>
                   
                   <Tag className="w-12 h-12 text-primary/10 group-hover:scale-110 transition-transform duration-500" />
                   
                   <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/20 to-transparent">
                      <Badge className={`text-[10px] font-black tracking-tighter ${product.stock <= product.minStock ? 'bg-destructive' : 'bg-primary'}`}>
                        {product.stock} EN STOCK
                      </Badge>
                   </div>
                </div>
                <CardHeader className="p-3 space-y-1">
                   <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest line-clamp-1">{product.category}</span>
                      <span className="text-[9px] font-mono text-primary font-bold">{product.sku}</span>
                   </div>
                   <CardTitle className="text-sm font-bold leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">{product.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 flex items-center justify-between">
                   <div className="text-lg font-black text-foreground">{fmt(product.price)}</div>
                   <div className="text-[10px] text-muted-foreground font-medium italic">Margen: {Math.round(((product.price - product.cost) / product.price) * 100)}%</div>
                </CardContent>
             </Card>
           ))}
        </div>
      )}

      {/* Dialog: Nuevo / Editar Producto */}
      <Dialog open={isDialogOpen} onOpenChange={open => { setIsDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingProduct ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? `Modificando: ${editingProduct.name}` : 'Completa los datos o escanea el código de barras'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            {/* SKU / barcode */}
            <div className="space-y-2">
              <Label htmlFor="sku" className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-primary" /> SKU / Código de Barras *
              </Label>
              <Input id="sku" ref={skuRef} value={formData.sku}
                onChange={async e => {
                  const val = e.target.value
                  setFormData({ ...formData, sku: val })
                  if (!editingProduct && val.length >= 3) {
                    const found = products.find(p => p.sku === val && p.isActive)
                    if (found) { toast.info(`Producto detectado: ${found.name}`); openEditDialog(found) }
                  }
                }}
                placeholder="Escanea o escribe el SKU"
                className="font-mono text-primary font-bold" disabled={!!editingProduct} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Input id="category" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="Ej: Hardware, Accesorios..." />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Nombre del Producto *</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: Teclado Mecánico RGB" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción breve del producto" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Precio de Venta * ($)</Label>
              <Input id="price" type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Costo ($)</Label>
              <Input id="cost" type="number" step="0.01" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Actual *</Label>
              <Input id="stock" type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Stock Mínimo (alerta)</Label>
              <Input id="minStock" type="number" value={formData.minStock} onChange={e => setFormData({ ...formData, minStock: e.target.value })} placeholder="5" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={saveProduct} disabled={saving} className="gap-2 bg-gradient-to-r from-primary to-accent">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
