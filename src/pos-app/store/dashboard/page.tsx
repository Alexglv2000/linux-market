'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRealtime } from '@/hooks/use-realtime'
import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  AlertCircle,
  Users,
  Globe,
  Monitor,
  Wifi,
  Clock,
  ArrowRightCircle,
  FileBarChart,
  Boxes,
  Zap
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { useAuth } from '@/lib/auth-context'
import { useCurrency } from '@/hooks/use-currency'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { infoApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { AIAdvisor } from '@/components/ai-advisor'

export default function DashboardPage() {
  const { user } = useAuth()
  const { formatCurrency: fmt } = useCurrency()
  const [salesData, setSalesData] = useState<any[]>([])
  const [localIp, setLocalIp] = useState<string>('...')
  const [serverPort, setServerPort] = useState<string>('3000')
  const [currentTime, setCurrentTime] = useState(new Date())

  // Reloj en vivo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Detectar IP real de la red local
  useEffect(() => {
    setLocalIp('detectando...')
    infoApi.get().then(res => {
      // Priorizar la IP que nos da el servidor (que ya está filtrada)
      setLocalIp(res.ip || window.location.hostname)
      setServerPort(res.port || window.location.port || '3001')
    }).catch(() => {
      setLocalIp(window.location.hostname)
      setServerPort(window.location.port || '3001')
    })
  }, [])

  // Live data from shared API
  const { products, sales, stats: serverStats } = useRealtime()
  const lowStockProducts = products?.filter(p => p.stock <= p.minStock && p.isActive) || []
  
  useEffect(() => {
    try {
      if (sales) {
        // Group sales by date for last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (6 - i))
          return date.toISOString().split('T')[0]
        })

        const grouped = last7Days.map(date => {
          const daySales = sales.filter(s => {
            try {
              const sDate = s.createdAt ? s.createdAt.replace(' ', 'T') : null;
              if (!sDate) return false;
              const parsedDate = new Date(sDate)
              if (isNaN(parsedDate.getTime())) return false;
              return parsedDate.toISOString().split('T')[0] === date && s.status === 'completada'
            } catch (innerErr) {
              return false
            }
          })
          return {
            date: new Date(date + 'T12:00:00Z').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
            ventas: daySales.length,
            total: daySales.reduce((sum, s) => sum + (Number(s.total) || 0), 0)
          }
        })

        setSalesData(grouped)
      }
    } catch (err) {
      console.warn('[Analytics] Calculation error:', err)
    }
  }, [sales])

  // Calculate stats - Use serverStats if available for historical accuracy, fallback to client-side for immediate feedback
  const totalSales = serverStats?.totalSales || sales?.filter(s => s.status === 'completada').length || 0
  const totalRevenue = serverStats?.totalRevenue || sales?.filter(s => s.status === 'completada').reduce((sum, s) => sum + s.total, 0) || 0
  const totalProducts = serverStats?.totalProducts || products?.filter(p => p.isActive).length || 0
  const totalStock = serverStats?.totalStock || products?.filter(p => p.isActive).reduce((sum, p) => sum + p.stock, 0) || 0

  const stats = [
    // ADMINS see everything
    ...(user?.role?.includes('admin') ? [
      {
        name: 'Ventas de Sucursal',
        value: totalSales.toString(),
        icon: ShoppingCart,
        change: '+12%',
        changeType: 'positive' as const,
        color: 'text-chart-1'
      },
      {
        name: 'Ingresos Totales',
        value: fmt(totalRevenue),
        icon: DollarSign,
        change: '+8%',
        changeType: 'positive' as const,
        color: 'text-chart-2'
      }
    ] : []),
    // CAJERO sees personal sales
    ...(user?.role === 'cajero' ? [
      {
        name: 'Mis Ventas Hoy',
        value: sales?.filter(s => {
          try {
            const sDate = s.createdAt ? s.createdAt.replace(' ', 'T') : null;
            if (!sDate) return false;
            const parsedDate = new Date(sDate)
            if (isNaN(parsedDate.getTime())) return false;
            return s.userId === user?.id && parsedDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
          } catch {
            return false
          }
        }).length.toString(),
        icon: TrendingUp,
        change: 'En turno',
        changeType: 'positive' as const,
        color: 'text-chart-1'
      }
    ] : []),
    // ALMACENISTA and ADMINS see products
    ...(user?.role !== 'cajero' ? [
      {
        name: 'Productos en Catálogo',
        value: totalProducts.toString(),
        icon: Package,
        change: '+3',
        changeType: 'positive' as const,
        color: 'text-chart-3'
      },
      {
        name: 'Stock Total Unidades',
        value: totalStock.toString(),
        icon: Globe,
        change: '-5%',
        changeType: 'negative' as const,
        color: 'text-chart-4'
      }
    ] : []),
    // EVERYONE EXCEPT CAJERO sees low stock count
    ...(user?.role !== 'cajero' ? [
       {
        name: 'Alertas de Stock',
        value: lowStockProducts.length.toString(),
        icon: AlertCircle,
        change: 'Revisar',
        changeType: lowStockProducts.length > 0 ? 'negative' as const : 'positive' as const,
        color: 'text-destructive'
      }
    ] : [])
  ]

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)] animate-pulse" />
            Terminal de Operaciones · v1.2
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white">Panel de Control</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-sm font-medium text-muted-foreground">
              Sesión activa: <span className="font-black text-white italic">@{user?.name ? user.name.toLowerCase().replace(/\s+/g, '_') : 'usuario'}</span>
            </p>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs bg-white/5 px-3 py-1 rounded-xl border border-white/10 backdrop-blur-md">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="tabular-nums">{currentTime.toLocaleTimeString('es-MX', { hour12: false })}</span>
            </div>
          </div>
        </div>
        
        <div className="glass-card max-w-lg border-primary/20 bg-primary/5 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
             <Globe className="w-16 h-16" />
          </div>
          <div className="flex items-start gap-4">
             <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                <Wifi className="w-5 h-5 text-primary" />
             </div>
             <div className="flex-1">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Servidor Local Activo</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">Acceso remoto para terminales secundarias en la misma red:</p>
                <div className="flex items-center gap-2">
                   <code className="bg-black/40 px-3 py-1.5 rounded-lg text-[10px] font-mono text-primary font-bold border border-white/5 select-all">
                     http://{localIp}:{serverPort}
                   </code>
                   <Monitor className="w-3.5 h-3.5 text-muted-foreground/50" />
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="glass-card group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <stat.icon className="w-20 h-20" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
              <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                {stat.name}
              </CardTitle>
              <div className={cn("p-2 rounded-xl bg-white/5 border border-white/5 transition-transform group-hover:scale-110", stat.color)}>
                <stat.icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black tracking-tighter tabular-nums mb-1">{stat.value}</div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
                  stat.changeType === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                )}>
                  {stat.change}
                </span>
                <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">Estado</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
           <div className="w-1.5 h-4 bg-primary rounded-full shadow-[0_0_10px_var(--primary)]" />
           <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white">Consola de Acceso Rápido</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
           {user?.role === 'cajero' && (
             <>
               <Link href="/store/dashboard/pos" className="col-span-2">
                 <Button className="w-full h-20 text-xl font-black bg-white text-black hover:bg-white/90 shadow-2xl shadow-white/10 rounded-3xl group transition-all">
                    <ShoppingCart className="mr-4 w-7 h-7 group-hover:scale-110 transition-transform" />
                    Punto de Venta
                    <ArrowRightCircle className="ml-auto w-6 h-6 opacity-30 group-hover:translate-x-1 transition-transform" />
                 </Button>
               </Link>
               <Link href="/store/dashboard/pos/kiosk">
                 <Button variant="outline" className="w-full h-20 rounded-3xl border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-xl flex flex-col gap-1.5 items-center justify-center transition-all">
                    <Monitor className="w-6 h-6 text-primary shadow-[0_0_10px_var(--primary)]" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Kiosco</span>
                 </Button>
               </Link>
             </>
           )}
           {user?.role === 'almacenista' && (
             <>
               <Link href="/store/dashboard/inventory" className="col-span-2">
                 <Button className="w-full h-20 text-xl font-black bg-violet-600 text-white hover:bg-violet-500 shadow-2xl shadow-violet-600/20 rounded-3xl group transition-all">
                    <Boxes className="mr-4 w-7 h-7 group-hover:scale-110 transition-transform" />
                    Logística
                    <ArrowRightCircle className="ml-auto w-6 h-6 opacity-30" />
                 </Button>
               </Link>
             </>
           )}
           {user?.role?.includes('admin') && (
             <>
               <Link href="/store/dashboard/reports" className="col-span-2">
                 <Button className="w-full h-20 text-xl font-black bg-emerald-600 text-white hover:bg-emerald-500 shadow-2xl shadow-emerald-500/20 rounded-3xl group transition-all">
                    <FileBarChart className="mr-4 w-7 h-7 group-hover:scale-110 transition-transform" />
                    Inteligencia
                    <ArrowRightCircle className="ml-auto w-6 h-6 opacity-30" />
                 </Button>
               </Link>
               <Link href="/store/dashboard/inventory">
                 <Button variant="outline" className="w-full h-20 rounded-3xl border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-xl flex flex-col gap-1.5 items-center justify-center transition-all">
                    <Package className="w-6 h-6 text-amber-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Stock</span>
                 </Button>
               </Link>
               <Link href="/store/dashboard/users">
                 <Button variant="outline" className="w-full h-20 rounded-3xl border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-xl flex flex-col gap-1.5 items-center justify-center transition-all">
                    <Users className="w-6 h-6 text-indigo-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Equipo</span>
                 </Button>
               </Link>
             </>
           )}
        </div>
      </div>

      {/* Analytics */}
      {(user?.role?.includes('admin')) && (
        <div className="grid gap-8 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg font-black tracking-tight text-white uppercase">Volumen de Transacciones</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Últimos 7 días de operación</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.28 0.05 290 / 0.1)" />
                  <XAxis dataKey="date" tick={{ fill: 'oklch(0.58 0.05 285)', fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'oklch(0.58 0.05 285)', fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'oklch(0.11 0.03 285)', border: '1px solid oklch(0.28 0.05 290 / 0.2)', borderRadius: '1rem', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ color: 'white', fontWeight: 900 }}
                  />
                  <Bar dataKey="ventas" fill="oklch(0.62 0.22 295)" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
  
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg font-black tracking-tight text-white uppercase">Flujo de Caja</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Tendencia de ingresos liquidados</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.28 0.05 290 / 0.1)" />
                  <XAxis dataKey="date" tick={{ fill: 'oklch(0.58 0.05 285)', fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'oklch(0.58 0.05 285)', fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'oklch(0.11 0.03 285)', border: '1px solid oklch(0.28 0.05 290 / 0.2)', borderRadius: '1rem', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ color: 'white', fontWeight: 900 }}
                    formatter={(value: any) => [fmt(value), 'Ingresos']}
                  />
                  <Line type="monotone" dataKey="total" stroke="oklch(0.7 0.3 140)" strokeWidth={4} dot={{ fill: 'oklch(0.7 0.3 140)', r: 6 }} activeDot={{ r: 8, stroke: 'white', strokeWidth: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Low Stock Notifications */}
      {lowStockProducts && lowStockProducts.length > 0 && (
        <Card className="glass-card border-red-500/30 bg-red-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
             <AlertCircle className="w-32 h-32 text-red-500" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-red-400 font-black tracking-tight uppercase">
              <AlertCircle className="w-6 h-6 animate-pulse" />
              Alertas de Suministro Crítico
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-red-400/60">
              {lowStockProducts.length} ítems operando bajo el margen de seguridad
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lowStockProducts.slice(0, 6).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-red-500/10 hover:border-red-500/30 transition-colors">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-black text-white truncate">{product.name}</p>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase">{product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-red-500 tabular-nums">{product.stock}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">stock</p>
                  </div>
                </div>
              ))}
            </div>
            {lowStockProducts.length > 6 && (
              <div className="mt-6 text-center">
                 <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-all">
                    Ver todos los avisos ({lowStockProducts.length}) →
                 </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AIAdvisor />
    </div>
  )
}
