'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Store, TrendingUp, Users, Package, Activity, LogOut,
  Plus, Download, Settings, BarChart3, ArrowLeftRight,
  CheckCircle, Clock, Truck, Monitor
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import Link from 'next/link'
import { useRealtime } from '@/hooks/use-realtime'
import { usersApi, sucursalesApi, auditApi, transfersApi } from '@/lib/api'
import { cn } from '@/lib/utils'

import { Scanline } from '@/components/premium-ui'

export default function CentralDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  
  const { products, sales } = useRealtime()
  const [sucursales, setSucursales] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [transfers, setTransfers] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('linuxmarket_central_user')
      if (!storedUser) {
        router.push('/central/login')
      } else {
        setUser(JSON.parse(storedUser))
      }
    } catch {
      router.push('/central/login')
    }
  }, [router])

  useEffect(() => {
    Promise.all([
      sucursalesApi.getAll().then(setSucursales),
      usersApi.getAll().then(res => setAllUsers(res.filter(u => u.isActive))),
      transfersApi.getAll().then(setTransfers),
      auditApi.getAll().then(setAuditLogs)
    ]).catch(() => console.error('Error fetching central data'))
  }, [])

  const handleLogout = () => {
    try { localStorage.removeItem('linuxmarket_central_user') } catch { /* noop */ }
    router.push('/central/login')
  }

  // Stats
  const completedSales = sales?.filter(s => s.status === 'completada') || []
  const totalRevenue   = completedSales.reduce((s, sale) => s + sale.total, 0)

  // Sales by month (last 6)
  const salesByMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const month = d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
    const monthEnd   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    const monthSales = completedSales.filter(s => {
      const dt = new Date(s.createdAt)
      return dt >= monthStart && dt <= monthEnd
    })
    return {
      month,
      ventas: monthSales.reduce((sum, s) => sum + s.total, 0)
    }
  })

  // Performance by sucursal
  const storesPerf = sucursales?.map(suc => ({
    store: suc.name.split(' ')[0],
    ventas: completedSales.filter(s => s.sucursalId === suc.code).reduce((sum, s) => sum + s.total, 0),
    productos: products?.filter(p => p.sucursalId === suc.code).length || 0,
  })) || []

  if (!user) return null

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="min-h-screen text-foreground selection:bg-primary/30 selection:text-primary-foreground">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-2xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/central/dashboard" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 group-hover:scale-105 transition-transform duration-500">
              <Store className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight leading-none block group-hover:text-primary transition-colors">Linux-Market Central</span>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{user?.storeName || 'Cargando sucursal...'}</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/central/settings">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="h-10 rounded-xl px-4 font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20 transition-all">
              <LogOut className="w-4 h-4 mr-2" /> Salir de Consola
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10 space-y-10">
        {/* Intro */}
        <div className="space-y-1">
           <h1 className="text-4xl font-black tracking-tight text-white">Consola de Gestión Consolidada</h1>
           <p className="text-sm font-medium text-muted-foreground">Bienvenido de nuevo, <span className="text-primary font-bold">{user?.ownerName || user?.email}</span>. Aquí está el estado global de tu ecosistema.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { label: 'Sucursales', value: sucursales?.length || 0, icon: Store, footer: 'Conectadas en vivo', color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Ingresos', value: fmt(totalRevenue), icon: TrendingUp, footer: `${completedSales.length} transacciones`, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Operadores', value: allUsers?.length || 0, icon: Users, footer: 'Personal verificado', color: 'text-violet-400', bg: 'bg-violet-500/10' },
            { label: 'Catálogo', value: products?.length || 0, icon: Package, footer: 'SKUs activos', color: 'text-amber-400', bg: 'bg-amber-500/10' }
          ].map(kpi => (
            <Card key={kpi.label} className="glass-card border-white/5 bg-white/5 backdrop-blur-xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-15 transition-opacity">
                 <kpi.icon className="w-16 h-16" />
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-2">
                   <div className={cn("p-1.5 rounded-lg", kpi.bg)}>
                      <kpi.icon className={cn("w-4 h-4", kpi.color)} />
                   </div>
                   <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">{kpi.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black tracking-tighter tabular-nums mb-1">
                  {kpi.value}
                </div>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">{kpi.footer}</p>
              </CardContent>
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="stores" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <TabsList className="bg-white/5 border border-white/10 p-1 h-14 rounded-2xl backdrop-blur-xl">
            <TabsTrigger value="stores" className="rounded-xl px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all"><Store className="w-4 h-4 mr-2" /> Mis Sucursales</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all"><BarChart3 className="w-4 h-4 mr-2" /> Inteligencia</TabsTrigger>
            <TabsTrigger value="transfers" className="rounded-xl px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all"><ArrowLeftRight className="w-4 h-4 mr-2" /> Logística</TabsTrigger>
            <TabsTrigger value="activity" className="rounded-xl px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all"><Activity className="w-4 h-4 mr-2" /> Auditoría</TabsTrigger>
          </TabsList>

          {/* Stores Tab */}
          <TabsContent value="stores" className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white">Ecosistema de Tiendas</h2>
                <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase">Operatividad en Tiempo Real</p>
              </div>
              <Button asChild className="h-11 rounded-xl font-bold bg-white text-black hover:bg-white/90">
                <Link href="/store/login"><Plus className="w-4 h-4 mr-2" /> Acceder a Terminal</Link>
              </Button>
            </div>

            {sucursales?.length === 0 ? (
              <Card className="glass-card border-dashed border-white/10 bg-white/5 py-16 text-center">
                <CardContent>
                  <Store className="w-16 h-16 mx-auto mb-4 opacity-10" />
                  <p className="text-xl font-black text-white/40">Sin sucursales vinculadas</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">Configura nuevas estaciones desde el panel de Super Admin</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sucursales?.map((store) => {
                  const storeSales = completedSales.filter(s => s.sucursalId === store.code)
                  const storeRevenue = storeSales.reduce((s, sale) => s + sale.total, 0)
                  const storeProducts = products?.filter(p => p.sucursalId === store.code).length || 0
                  return (
                    <Card key={store.id} className="glass-card group hover:-translate-y-2 transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-4">
                          <Badge variant="outline" className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-primary/20 bg-primary/10 text-primary",
                            !store.isActive && "border-red-500/20 bg-red-500/10 text-red-400"
                          )}>
                            {store.isActive ? 'ACTIVA · ONLINE' : 'INACTIVA'}
                          </Badge>
                          <Button variant="ghost" size="sm" asChild className="h-8 rounded-lg hover:bg-white/10 text-xs font-bold">
                            <Link href="/store/login">Terminal →</Link>
                          </Button>
                        </div>
                        <CardTitle className="text-2xl font-black tracking-tight text-white mb-1">{store.name}</CardTitle>
                        <CardDescription className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">{store.code}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-3 rounded-2xl bg-black/30 border border-white/5">
                              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Ingresos</p>
                              <p className="text-xl font-black text-emerald-400">{fmt(storeRevenue)}</p>
                           </div>
                           <div className="p-3 rounded-2xl bg-black/30 border border-white/5">
                              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Stock</p>
                              <p className="text-xl font-black text-blue-400">{storeProducts}</p>
                           </div>
                        </div>
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                           <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-xs font-bold text-white">{storeSales.length} Ventas</span>
                           </div>
                           <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: '65%' }} />
                           </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-8">
            <h2 className="text-2xl font-black tracking-tight text-white">Inteligencia de Negocio</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg font-black tracking-tight">Tendencia de Ingresos</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest">Semestre Consolidado</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={salesByMonth}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.28 0.05 290 / 0.1)" />
                      <XAxis dataKey="month" tick={{ fill: 'oklch(0.58 0.05 285)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'oklch(0.58 0.05 285)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'oklch(0.11 0.03 285)', border: '1px solid oklch(0.28 0.05 290 / 0.3)', borderRadius: '1rem', backdropFilter: 'blur(10px)' }} 
                        itemStyle={{ color: 'white', fontWeight: 900 }}
                        formatter={(v: any) => [fmt(v), 'Ingresos']} 
                      />
                      <Line type="monotone" dataKey="ventas" stroke="oklch(0.62 0.22 295)" strokeWidth={4} dot={{ fill: 'oklch(0.62 0.22 295)', r: 6, strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 4, stroke: 'white' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg font-black tracking-tight">Ventas por Plaza</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest">Distribución Geográfica</CardDescription>
                </CardHeader>
                <CardContent>
                  {storesPerf.length === 0 ? (
                    <div className="h-[320px] flex items-center justify-center text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-30">
                      Sin datos históricos de ventas
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={storesPerf}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.28 0.05 290 / 0.1)" />
                        <XAxis dataKey="store" tick={{ fill: 'oklch(0.58 0.05 285)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'oklch(0.58 0.05 285)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'oklch(0.11 0.03 285)', border: '1px solid oklch(0.28 0.05 290 / 0.3)', borderRadius: '1rem', backdropFilter: 'blur(10px)' }} 
                          itemStyle={{ color: 'white', fontWeight: 900 }}
                          formatter={(v: any) => [fmt(v), 'Ingresos']} 
                        />
                        <Bar dataKey="ventas" fill="oklch(0.62 0.22 295)" radius={[8, 8, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Transfers Tab */}
          <TabsContent value="transfers" className="space-y-8">
            <h2 className="text-2xl font-black tracking-tight text-white">Gestión de Logística</h2>
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: 'Pendientes', count: transfers?.filter(t => t.status === 'pendiente').length || 0, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                { label: 'En Tránsito', count: transfers?.filter(t => t.status === 'en_transito').length || 0, icon: Truck, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                { label: 'Completadas', count: transfers?.filter(t => t.status === 'completada').length || 0, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
              ].map(({ label, count, icon: Icon, color, bg }) => (
                <Card key={label} className="glass-card overflow-hidden">
                  <CardContent className="pt-6 flex items-center gap-6">
                    <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-lg", bg)}>
                      <Icon className={cn("w-8 h-8", color)} />
                    </div>
                    <div>
                      <div className="text-3xl font-black tabular-nums">{count}</div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-black tracking-tight">Inventario en Movimiento</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest">Tracking Global de Transferencias</CardDescription>
              </CardHeader>
              <CardContent>
                {transfers?.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-sm font-bold uppercase tracking-widest opacity-20">
                    Sin operaciones logísticas recientes
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transfers?.slice(0, 8).map(t => (
                      <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-black/20 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                              <ArrowLeftRight className="w-5 h-5 text-primary" />
                           </div>
                           <div>
                              <div className="font-mono text-sm font-black text-white">{t.transferNumber}</div>
                              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                {t.fromSucursalId} <span className="text-primary mx-1">→</span> {t.toSucursalId}
                              </div>
                           </div>
                        </div>
                        <Badge variant="outline" className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em]",
                          t.status === 'completada' ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" : "border-amber-500/20 text-amber-400 bg-amber-500/5"
                        )}>
                          {t.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-8">
            <h2 className="text-2xl font-black tracking-tight text-white">Auditoría Global</h2>
            <Card className="glass-card relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Activity className="w-32 h-32" />
              </div>
              <CardHeader>
                <CardTitle className="text-lg font-black tracking-tight">Registro de Transacciones de Sistema</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest">Últimos eventos del núcleo</CardDescription>
              </CardHeader>
              <CardContent>
                {auditLogs?.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-sm font-bold uppercase tracking-widest opacity-20">
                    Sin actividad auditada
                  </div>
                ) : (
                  <div className="space-y-4">
                    {auditLogs?.map((log) => (
                      <div key={log.id} className="flex items-start gap-4 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 border border-primary/20">
                          <Activity className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                             <p className="text-sm font-black text-white">{log.username}</p>
                             <span className="text-[10px] font-mono text-muted-foreground/60">{new Date(log.createdAt).toLocaleString('es-MX')}</span>
                          </div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            <span className="text-primary">{log.action}</span>
                            {' '}{log.entity} #{log.entityId}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: 'Instaladores', icon: Download, desc: 'Binarios para Linux Nativo', link: '/#downloads', label: 'Ver Descargas' },
            { title: 'Terminal POS', icon: Monitor, desc: 'Acceso a punto de venta', link: '/store/dashboard', label: 'Ir al POS' },
            { title: 'Soporte v1.2', icon: Activity, desc: 'Base de conocimiento', link: '/', label: 'Documentación' }
          ].map(action => (
            <Card key={action.title} className="glass-card hover:border-primary/40 transition-all p-6 group">
              <action.icon className="w-12 h-12 text-primary mb-6 group-hover:scale-110 transition-transform duration-500" />
              <CardTitle className="text-xl font-black text-white mb-2">{action.title}</CardTitle>
              <CardDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">{action.desc}</CardDescription>
              <Button variant="outline" className="w-full h-11 rounded-xl border-white/10 hover:bg-white text-white hover:text-black font-bold transition-all" asChild>
                <Link href={action.link}>{action.label}</Link>
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
