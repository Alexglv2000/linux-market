'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useRealtime } from '@/hooks/use-realtime'
import { usersApi, auditApi } from '@/lib/api'
import { FileText, Download, TrendingUp, Package, DollarSign, ShoppingCart, Activity, RefreshCw } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { toast } from 'sonner'

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('week')
  const { products, sales, loading } = useRealtime()
  
  const [users, setUsers] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      usersApi.getAll().then(setUsers),
      auditApi.getAll().then(setAuditLogs)
    ]).catch(() => console.error("Error loading extra data"))
  }, [])

  // Calculate date range
  const getDateFilter = (): Date => {
    const now = new Date()
    if (dateRange === 'today') {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    }
    if (dateRange === 'week') {
      const d = new Date(now); d.setDate(d.getDate() - 7); return d
    }
    if (dateRange === 'month') {
      const d = new Date(now); d.setDate(d.getDate() - 30); return d
    }
    const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d
  }

  const filteredSales = sales?.filter(s => {
    if (!s.createdAt) return false;
    const sDate = s.createdAt.replace(' ', 'T');
    return s.status === 'completada' && new Date(sDate) >= getDateFilter()
  }) || []

  // Sales analytics
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0)
  const totalSalesCount = filteredSales.length
  const averageTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0
  const activeProducts = products?.filter(p => p.isActive) || []
  const totalProducts = activeProducts.length

  // Sales by payment method
  const paymentMethodData = [
    { name: 'Efectivo', value: filteredSales.filter(s => s.paymentMethod === 'efectivo').length },
    { name: 'Tarjeta', value: filteredSales.filter(s => s.paymentMethod === 'tarjeta').length },
    { name: 'Transferencia', value: filteredSales.filter(s => s.paymentMethod === 'transferencia').length },
    { name: 'QR / CoDi', value: filteredSales.filter(s => s.paymentMethod === 'qr').length },
  ].filter(d => d.value > 0)

  // Sales by day
  const salesByDay = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dateStr = date.toISOString().split('T')[0]
    
    const daySales = filteredSales.filter(s => {
      if (!s.createdAt) return false;
      const sDate = s.createdAt.replace(' ', 'T');
      return new Date(sDate).toISOString().split('T')[0] === dateStr
    })
    
    return {
      date: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
      ventas: daySales.length,
      ingresos: daySales.reduce((sum, s) => sum + s.total, 0)
    }
  })

  // Top selling products
  const productSales = new Map<number, { name: string; sku: string; quantity: number; revenue: number }>()
  
  filteredSales.forEach(sale => {
    const items = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items
    items.forEach((item: any) => {
      const existing = productSales.get(item.productId)
      if (existing) {
        existing.quantity += item.quantity
        existing.revenue += item.subtotal
      } else {
        productSales.set(item.productId, {
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          revenue: item.subtotal
        })
      }
    })
  })

  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)

  const bottomProducts = Array.from(productSales.values())
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 10)

  // Cashier performance
  const cashierSales = new Map<number, { name: string; username: string; count: number; total: number }>()
  
  filteredSales.forEach(sale => {
    const existing = cashierSales.get(sale.userId)
    const userData = users?.find(u => u.id === sale.userId)
    if (existing) {
      existing.count++
      existing.total += sale.total
    } else {
      cashierSales.set(sale.userId, {
        name: userData?.name || 'Desconocido',
        username: userData?.username || 'user',
        count: 1,
        total: sale.total
      })
    }
  })

  const topCashiers = Array.from(cashierSales.values()).sort((a, b) => b.total - a.total)

  // Prediction (Simple average projection)
  const dayCount = dateRange === 'today' ? 1 : dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 365
  const dailyAvg = totalRevenue / dayCount
  const predictionData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i + 1)
    return {
      date: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
      proyeccion: dailyAvg * (1 + (Math.random() * 0.1 - 0.05)) // Avg with slight noise
    }
  })

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))']

  const exportToPDF = () => {
    const doc = new jsPDF()
    const title = `Reporte de Ventas - ${dateRange.toUpperCase()}`
    doc.setFontSize(22)
    doc.setTextColor(59, 130, 246)
    doc.text('Linux Market POS', 14, 20)
    
    doc.setFontSize(14)
    doc.setTextColor(0)
    doc.text(title, 14, 30)
    
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 38)
 
    // Executive Summary
    doc.setDrawColor(200)
    doc.line(14, 42, 196, 42)
    
    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text('Resumen Ejecutivo:', 14, 52)
    doc.setFontSize(10)
    doc.text(`Ingresos Totales: $${totalRevenue.toLocaleString('es-MX')}`, 14, 60)
    doc.text(`Total de Ventas: ${totalSalesCount}`, 14, 66)
    doc.text(`Ticket Promedio: $${averageTicket.toLocaleString('es-MX')}`, 14, 72)
 
    // Methods Table
    const methodTable = paymentMethodData.map(m => [m.name, m.value])
    ;(doc as any).autoTable({
      head: [['Método de Pago', 'Cantidad de Ventas']],
      body: methodTable,
      startY: 80,
      headStyles: { fillColor: [139, 92, 246] },
      margin: { right: 100 } // Small table for methods
    })
 
    // Top Products Table
    doc.setFontSize(12)
    doc.text('Top 10 Productos Más Vendidos:', 14, (doc as any).lastAutoTable.finalY + 15)
    
    const tableData = topProducts.map((p, i) => [i + 1, p.sku, p.name, p.quantity, `$${p.revenue.toLocaleString()}`])
    ;(doc as any).autoTable({
      head: [['#', 'SKU', 'Producto', 'Cantidad', 'Ingresos']],
      body: tableData,
      startY: (doc as any).lastAutoTable.finalY + 20,
      headStyles: { fillColor: [59, 130, 246] }
    })
 
    doc.save(`linux-market-report-${dateRange}-${Date.now()}.pdf`)
    toast.success('Reporte exportado exitosamente')
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes y Auditoría</h1>
          <p className="text-muted-foreground mt-1">
            Analiza el desempeño del negocio y revisa la actividad del sistema en tiempo real
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={exportToPDF}>
            <Download className="w-4 h-4" /> Exportar PDF
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Label>Período:</Label>
        <div className="flex gap-1">
          {(['today', 'week', 'month', 'year'] as const).map(range => (
            <Button key={range} variant={dateRange === range ? 'default' : 'outline'} size="sm" onClick={() => setDateRange(range)}>
              {range === 'today' && 'Hoy'}{range === 'week' && 'Semana'}{range === 'month' && 'Mes'}{range === 'year' && 'Año'}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="cashiers">Cajeros</TabsTrigger>
          <TabsTrigger value="prediction">Predicción</TabsTrigger>
          <TabsTrigger value="audit">Auditoría</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0"><CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle><DollarSign className="w-4 h-4 text-chart-1" /></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalRevenue.toLocaleString('es-MX')}</div>
                <p className="text-xs text-muted-foreground mt-1">En {dateRange === 'today' ? 'el día' : dateRange === 'week' ? 'la semana' : dateRange === 'month' ? 'el mes' : 'el año'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0"><CardTitle className="text-sm font-medium">Total Ventas</CardTitle><ShoppingCart className="w-4 h-4 text-chart-2" /></CardHeader>
              <CardContent><div className="text-2xl font-bold">{totalSalesCount}</div><p className="text-xs text-muted-foreground mt-1">Transacciones completadas</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0"><CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle><TrendingUp className="w-4 h-4 text-chart-3" /></CardHeader>
              <CardContent><div className="text-2xl font-bold">${averageTicket.toLocaleString('es-MX')}</div><p className="text-xs text-muted-foreground mt-1">Por transacción</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0"><CardTitle className="text-sm font-medium">Productos Activos</CardTitle><Package className="w-4 h-4 text-chart-4" /></CardHeader>
              <CardContent><div className="text-2xl font-bold">{totalProducts}</div><p className="text-xs text-muted-foreground mt-1">En inventario</p></CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Ingresos Diarios</CardTitle><CardDescription>Últimos 7 días</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesByDay}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }} formatter={(value: any) => `$${value.toLocaleString('es-MX')}`} />
                    <Line type="monotone" dataKey="ingresos" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Métodos de Pago</CardTitle><CardDescription>Distribución de ventas</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={paymentMethodData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                      {paymentMethodData.map((_entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Productos Más Vendidos</CardTitle><CardDescription>Top 10 por cantidad vendida en el período</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>#</TableHead><TableHead>SKU</TableHead><TableHead>Producto</TableHead><TableHead className="text-right">Cantidad</TableHead><TableHead className="text-right">Ingresos</TableHead></TableRow></TableHeader>
                <TableBody>
                  {topProducts.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8">Sin ventas en este período</TableCell></TableRow> : topProducts.map((p, i) => (
                    <TableRow key={p.sku}><TableCell>{i + 1}</TableCell><TableCell className="font-mono text-xs">{p.sku}</TableCell><TableCell>{p.name}</TableCell><TableCell className="text-right">{p.quantity}</TableCell><TableCell className="text-right">${p.revenue.toLocaleString('es-MX')}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashiers" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Desempeño de Cajeros</CardTitle><CardDescription>Ventas totales y transacciones por usuario</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Cajero</TableHead><TableHead className="text-right">Ventas</TableHead><TableHead className="text-right">Ingresos</TableHead></TableRow></TableHeader>
                <TableBody>
                  {topCashiers.map(c => (
                    <TableRow key={c.username}>
                      <TableCell><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground font-mono">{c.username}</div></TableCell>
                      <TableCell className="text-right">{c.count}</TableCell><TableCell className="text-right font-bold text-primary">${c.total.toLocaleString('es-MX')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prediction" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Previsión de Ventas</CardTitle><CardDescription>Proyección estimada (próximos 7 días)</CardDescription></CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={predictionData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }} formatter={(v: any) => `$${v.toLocaleString('es-MX')}`} />
                    <Line type="monotone" dataKey="proyeccion" stroke="hsl(var(--chart-2))" strokeWidth={3} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" /> Registro de Auditoría</CardTitle><CardDescription>Últimas actividades del servidor Express</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Usuario</TableHead><TableHead>Acción</TableHead><TableHead>Entidad</TableHead><TableHead>ID</TableHead></TableRow></TableHeader>
                <TableBody>
                  {auditLogs.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8">Sin registros</TableCell></TableRow> : auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.createdAt ? new Date(log.createdAt.replace(' ', 'T')).toLocaleString('es-MX') : '—'}
                      </TableCell>
                      <TableCell className="font-medium">{log.username}</TableCell>
                      <TableCell><code className="text-xs bg-muted px-2 py-1 rounded">{log.action}</code></TableCell>
                      <TableCell className="text-sm">{log.entity}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{log.entityId}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
