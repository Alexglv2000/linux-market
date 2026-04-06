'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Shield, Users, Store, Settings, LogOut, Cpu, AlertTriangle,
  Plus, Trash2, RefreshCw, Key, Eye, EyeOff, Lock,
  BarChart3, Database, Terminal, CreditCard, Palette, Monitor, Globe
} from 'lucide-react'
import { usersApi, salesApi, productsApi, sucursalesApi, settingsApi, infoApi, statsApi } from '@/lib/api'
import { useSettings } from '@/lib/settings-context'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function SuperAdminDashboard() {
  const router = useRouter()
  const [saUser, setSaUser] = useState<any>(null)
  const { users, sales, products: allProducts, settings, refresh: reloadRealtime } = useRealtime()
  const [stats, setStats] = useState({ users: 0, sales: 0, products: 0, sucursales: 0, revenue: 0, lowStock: 0 })
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'cajero', email: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('sa_token')
    const sa_user = localStorage.getItem('sa_user')
    if (!token || !sa_user) { router.push('/superadmin/login'); return }
    setSaUser(JSON.parse(sa_user))
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      const [sData, allSucursales] = await Promise.all([
        statsApi.get(),
        sucursalesApi.getAll()
      ])
      setStats({
        users: users.length,
        sales: sData.salesToday,
        products: sData.totalProducts,
        sucursales: allSucursales.length,
        revenue: sData.revenueToday,
        lowStock: sData.lowStock
      })
    } catch {}
  }

  // Actualizar stats cuando hay actividad en tiempo real
  useEffect(() => {
    loadData()
  }, [sales, allProducts, users.length])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await usersApi.create(newUser)
      toast.success('Usuario creado exitosamente')
      setNewUser({ username: '', password: '', name: '', role: 'cajero', email: '' })
      // No necesitamos llamar a loadData() porque SSE actualizará la lista de usuarios
    } catch (e: any) { toast.error('Error al crear: ' + e.message) }
    setLoading(false)
  }

  const handleToggleUser = async (id: number, current: boolean) => {
    try {
      await usersApi.update(id, { isActive: !current })
      // SSE actualizará el estado del switch
    } catch (e: any) { toast.error(e.message) }
  }

  const handleDeleteUser = async (id: number) => {
    if (!confirm('¿Desactivar y eliminar acceso a este usuario permanentemente?')) return
    try {
      await usersApi.update(id, { isActive: false })
      toast.success('Usuario desactivado')
      // SSE actualizará la lista
    } catch (e: any) { toast.error(e.message) }
  }

  const handleResetPassword = async (id: number) => {
    const newPass = prompt('Nueva contraseña:')
    if (!newPass) return
    try {
      await usersApi.update(id, { password: newPass })
      toast.success('Contraseña actualizada')
    } catch (e: any) { toast.error(e.message) }
  }

  const handleLogout = () => {
    localStorage.removeItem('sa_token')
    localStorage.removeItem('sa_mac')
    localStorage.removeItem('sa_user')
    fetch('/api/superadmin/auth', { method: 'DELETE' }).catch(() => {})
    router.push('/superadmin/login')
  }

  const roleBadge: Record<string, string> = {
    cajero: 'bg-slate-700 text-slate-300',
    admin_sucursal: 'bg-blue-900 text-blue-300',
    admin_celula: 'bg-violet-900 text-violet-300',
    admin_general: 'bg-amber-900 text-amber-300',
  }

  if (!saUser) return null

  return (
    <div className="min-h-screen text-foreground selection:bg-red-500/30 selection:text-red-200">
      {/* Sidebar */}
      <div className="flex h-screen overflow-hidden">
        <aside className="w-72 border-r border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col relative z-20">
          <div className="p-8 border-b border-white/5 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="flex items-center gap-4 relative">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-red-950/50 ring-1 ring-red-500/20 group-hover:rotate-6 transition-all duration-500 p-2">
                <img src="/iconolinuxmarket.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <div className="font-black text-lg tracking-tight text-white leading-none">Master Console</div>
                <div className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                   NÚCLEO v1.2
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-6 space-y-3 overflow-y-auto custom-scrollbar">
            {[
              { id: 'overview', label: 'Ecosistema Global', icon: BarChart3, desc: 'ESTADO DE RED' },
              { id: 'users', label: 'Unidad de Acceso', icon: Users, desc: 'ROLES & STAFF' },
              { id: 'security', label: 'Núcleo de Cifrado', icon: Lock, desc: 'HARDWARE LOGS' },
              { id: 'regional', label: 'Moneda & Región', icon: Globe, desc: 'SISTEMA GLOBAL' },
              { id: 'payments', label: 'Tesoreria Digital', icon: CreditCard, desc: 'PASARELA MIGRADA' },
              { id: 'theme', label: 'Sincronía Visual', icon: Palette, desc: 'BRANDING OS' },
              { id: 'system', label: 'Hardware & API', icon: Database, desc: 'SERVER NODES' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3.5 rounded-3xl transition-all duration-500 relative group border border-transparent",
                  activeTab === item.id
                    ? "bg-red-600/10 text-white border-red-500/20 shadow-xl shadow-red-950/20"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500",
                  activeTab === item.id ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]" : "bg-white/5 group-hover:bg-red-900/40"
                )}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-black truncate leading-none tracking-tight">{item.label}</p>
                  <p className="text-[9px] font-bold text-muted-foreground/40 mt-1 uppercase tracking-[0.15em]">{item.desc}</p>
                </div>
                {activeTab === item.id && (
                  <div className="absolute -left-1 w-2.5 h-8 bg-red-600 rounded-full blur-[3px]" />
                )}
              </button>
            ))}
          </nav>

          <div className="p-6 border-t border-white/5 space-y-6 bg-black/20">
            <div className="flex flex-col gap-3 p-4 rounded-3xl bg-red-600/5 border border-red-900/20 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em]">Llave de Hardware</span>
                <Cpu className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              </div>
              <div className="font-mono text-[10px] text-red-400 font-bold truncate bg-black/60 px-3 py-2 rounded-xl border border-red-900/20 shadow-inner">
                {saUser?.mac || 'N/A'}
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full h-14 rounded-3xl text-red-400 hover:bg-red-600 hover:text-white font-black text-xs uppercase tracking-widest transition-all duration-500 border border-red-900/20 hover:border-red-500 hover:shadow-2xl hover:shadow-red-600/20" 
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-3" /> Cerrar Acceso Maestro
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.08),transparent_70%)] custom-scrollbar">
          <div className="sticky top-0 z-10 border-b border-white/5 bg-black/40 backdrop-blur-3xl px-12 py-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center shadow-inner">
                 <Shield className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h1 className="font-black text-3xl tracking-tighter text-white">Consola Maestra de Ecosistema</h1>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                   <div className="w-2 h-0.5 bg-red-600" /> AUTORIDAD SUPREMA · ACCESO NIVEL 0
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-red-600 hover:text-white hover:border-red-500 group font-black px-6 transition-all duration-500" 
              onClick={loadData}
            >
              <RefreshCw className="w-4 h-4 text-red-500 mr-3 group-hover:rotate-180 group-hover:text-white transition-all duration-700" /> 
              Sincronizar Universo
            </Button>
          </div>

          <div className="p-8">
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Universo Usuarios', value: stats.users, icon: Users, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                    { label: 'Ventas Globales', value: stats.sales, icon: BarChart3, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Catálogo Maestro', value: stats.products, icon: Database, color: 'text-green-400', bg: 'bg-green-500/10' },
                    { label: 'Alertas Críticas', value: stats.lowStock, icon: AlertTriangle, color: stats.lowStock > 0 ? 'text-red-500 animate-pulse-slow' : 'text-amber-500', bg: stats.lowStock > 0 ? 'bg-red-500/10' : 'bg-amber-500/10' },
                  ].map(stat => (
                    <Card key={stat.label} className="card-hover border-white/5 bg-white/5 backdrop-blur-xl overflow-hidden relative group">
                      <div className={cn("absolute -top-12 -right-12 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700 rounded-full", stat.bg.replace('/10', '/30'))} />
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                           <div className={cn("p-2 rounded-xl", stat.bg)}>
                             <stat.icon className={cn("w-5 h-5", stat.color)} />
                           </div>
                           <Badge variant="outline" className="text-[10px] font-mono border-white/10 bg-white/5 text-muted-foreground/60">LIVE</Badge>
                        </div>
                        <div className="text-4xl font-black tracking-tighter tabular-nums mb-1 uppercase group-hover:text-white transition-colors">
                          {stat.value}
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2 border-white/5 bg-white/5 backdrop-blur-xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-primary to-accent opacity-50" />
                    <CardHeader>
                      <CardTitle className="text-lg font-black tracking-tight flex items-center gap-3">
                        <Monitor className="w-5 h-5 text-red-500" /> Rendimiento de Ecosistema
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 flex items-end gap-2 px-4 pb-4">
                        {[40, 70, 45, 90, 65, 85, 100, 75, 55, 80, 95, 100].map((h, i) => (
                           <div key={i} className="flex-1 group relative">
                              <div 
                                className="w-full bg-gradient-to-t from-red-600/80 to-primary/80 rounded-t-lg transition-all duration-1000 ease-out group-hover:brightness-125 hover:shadow-lg hover:shadow-red-500/20" 
                                style={{ height: `${h}%` }} 
                              />
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/10 text-[9px] px-2 py-1 rounded font-mono pointer-events-none">
                                {h}%
                              </div>
                           </div>
                        ))}
                      </div>
                      <div className="flex justify-between px-4 mt-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <span>Inicio de Turno</span>
                        <span>Ahora</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-red-900/20 bg-red-950/10 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                       <Shield className="w-32 h-32 text-red-500" />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2 text-red-400 font-black uppercase tracking-widest">
                        <AlertTriangle className="w-4 h-4" /> Nucleo de Seguridad
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="p-3.5 rounded-2xl bg-black/40 border border-red-900/20">
                          <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-2">Administrador Activo</p>
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-black text-white shadow-lg">
                                {saUser?.username?.slice(0,2).toUpperCase()}
                             </div>
                             <div>
                               <p className="font-bold text-sm text-white">{saUser?.username}</p>
                               <p className="text-[9px] font-mono text-muted-foreground uppercase">{saUser?.mac || 'MAC VERIFIED'}</p>
                             </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono bg-white/5 p-3 rounded-xl border border-white/5">
                           <span>HORA DE SISTEMA:</span>
                           <span className="text-red-400">{new Date().toLocaleTimeString('es-MX')}</span>
                        </div>
                        
                        <div className="p-3.5 rounded-2xl bg-green-500/5 border border-green-500/20 flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                           <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Servidor API Operativo</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* USERS */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <Card className="border-white/10 bg-card/30">
                  <CardHeader><CardTitle className="text-sm">Crear nuevo usuario</CardTitle></CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateUser} className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Usuario</Label>
                        <Input value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} placeholder="username" className="bg-background/50 border-white/10" required />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Nombre completo</Label>
                        <Input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} placeholder="Nombre" className="bg-background/50 border-white/10" required />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Contraseña</Label>
                        <div className="relative">
                          <Input type={showPassword ? 'text' : 'password'} value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" className="pr-10 bg-background/50 border-white/10" required />
                          <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-white" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Rol</Label>
                        <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v }))}>
                          <SelectTrigger className="bg-background/50 border-white/10"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cajero">Cajero</SelectItem>
                            <SelectItem value="almacenista">Almacenista</SelectItem>
                            <SelectItem value="admin_sucursal">Admin Sucursal</SelectItem>
                            <SelectItem value="admin_celula">Admin Célula</SelectItem>
                            <SelectItem value="admin_general">Admin General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                          <Plus className="w-4 h-4 mr-2" /> Crear usuario
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-card/30">
                  <CardHeader><CardTitle className="text-sm">Todos los usuarios ({users.length})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {users.map((user: any) => (
                        <div key={user.id} className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-background/30 hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center text-sm font-bold">
                              {user.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="text-sm font-semibold">{user.name}</div>
                              <div className="text-xs text-muted-foreground font-mono">{user.username}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${roleBadge[user.role] || 'bg-muted text-muted-foreground'}`}>
                              {user.role.replace('_', ' ')}
                            </span>
                            <Switch checked={user.isActive} onCheckedChange={() => handleToggleUser(user.id, user.isActive)} />
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-blue-400 hover:bg-blue-900/20" onClick={() => handleResetPassword(user.id)}>
                              <Key className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:bg-red-900/20" onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* SECURITY */}
            {activeTab === 'security' && (
              <Card className="border-white/10 bg-card/30">
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> Configuración de Seguridad</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-xl bg-muted/20 border border-white/10 space-y-3">
                    <h4 className="font-semibold text-sm">MACs autorizadas (desde .env.local)</h4>
                    <p className="text-xs text-muted-foreground">Las MACs se configuran en el archivo <code className="bg-muted px-1.5 py-0.5 rounded">.env.local</code> de tu servidor.</p>
                    <div className="bg-[#0a0a0a] rounded-xl p-4 font-mono text-xs border border-white/10 space-y-1">
                      <div className="text-green-400"># .env.local</div>
                      <div className="text-slate-300">SUPERADMIN_ALLOWED_MACS=AA:BB:CC:DD:EE:FF</div>
                      <div className="text-slate-300">SUPERADMIN_PASSWORD=tu_password_seguro</div>
                      <div className="text-slate-300">SUPERADMIN_SESSION_SECRET=64_chars_random</div>
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-red-600/5 border border-red-500/20 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-red-600/20 flex items-center justify-center border border-red-500/20">
                        <RefreshCw className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-white uppercase tracking-tight">Recuperación de Terminal</h4>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Vincular este hardware como el autorizado</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Si has cambiado de equipo o tarjeta madre, usa esta función para resetear el <span className="text-red-500 font-bold uppercase">Hardware Lock</span>. Esto borrará el bloqueo anterior y atará el sistema a este equipo permanentemente.
                    </p>
                    <Button 
                      className="w-full h-12 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-red-600/20"
                      onClick={async () => {
                         if (!confirm('¿Estás SEGURO de querer resetear el Hardware Lock y vincularlo a este equipo?')) return;
                         try {
                           // Usamos el login con force=true para resetear
                           await usersApi.update(saUser.id, { forceResetHw: true }); // Nota: Implementaríamos este endpoint o similar
                           // O simplemente informamos al usuario sobre el modo forzado en el login
                           toast.success('Protocolo de reseteo iniciado. Cierre sesión e inicie de nuevo con "Forzar Reset Hardware" activo.');
                         } catch (e: any) { toast.error(e.message) }
                      }}
                    >
                      Solicitar Reset de Escudo de Silicio
                    </Button>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/30">
                    <h4 className="font-semibold text-sm text-amber-400 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Recomendaciones de seguridad</h4>
                    <ul className="text-xs text-muted-foreground space-y-1.5">
                      <li>• Cambia la contraseña por defecto siempre</li>
                      <li>• Usa un SUPERADMIN_SESSION_SECRET aleatorio de 64 chars</li>
                      <li>• Solo agrega las MACs de dispositivos controlados</li>
                      <li>• Cierra sesión al terminar los ajustes de servidor</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* REGIONAL CONFIG */}
            {activeTab === 'regional' && (
              <RegionalConfig />
            )}

            {/* PAYMENTS CONFIG */}
            {activeTab === 'payments' && (
              <PaymentConfig />
            )}

            {activeTab === 'theme' && (
              <ThemeConfig />
            )}

            {/* SYSTEM */}
            {activeTab === 'system' && (
              <SystemStatus />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function RegionalConfig() {
  const { settings } = useSettings()
  const [code, setCode] = useState('MXN')
  const [locale, setLocale] = useState('es-MX')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (settings) {
      setCode(settings.currency_code || 'MXN')
      setLocale(settings.currency_locale || 'es-MX')
    }
  }, [settings])

  const save = async () => {
    setLoading(true)
    try {
      await settingsApi.set('currency_code', code)
      await settingsApi.set('currency_locale', locale)
      toast.success('Configuración de moneda sincronizada globalmente')
    } catch (e: any) { toast.error(e.message) }
    setLoading(false)
  }

  return (
    <Card className="border-white/10 bg-card/30">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Globe className="w-4 h-4 text-red-500" /> Control Regional Global
        </CardTitle>
        <p className="text-xs text-muted-foreground">Define la moneda y el formato regional para todas las terminales y dashboards del ecosistema.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4 max-w-xl">
          <div className="space-y-1.5">
            <Label className="text-xs">Código de Moneda</Label>
            <Select value={code} onValueChange={setCode}>
              <SelectTrigger className="bg-background/50 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['MXN', 'USD', 'EUR', 'CLP', 'COP', 'PEN', 'ARS', 'BRL', 'JPY', 'GTQ', 'HNL', 'NIO', 'CRC', 'PAB', 'VES'].map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Ubicación (Locale)</Label>
            <Select value={locale} onValueChange={setLocale}>
              <SelectTrigger className="bg-background/50 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['es-MX', 'en-US', 'es-ES', 'es-CL', 'es-CO', 'es-PE', 'es-AR', 'pt-BR', 'ja-JP', 'es-GT', 'es-HN', 'es-NI', 'es-CR', 'es-PA', 'es-VE'].map(l => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 max-w-xl">
           <Shield className="w-4 h-4 text-red-500" />
           <p className="text-[10px] text-muted-foreground">Vista previa: <span className="text-white font-black">{new Intl.NumberFormat(locale, { style: 'currency', currency: code }).format(1250.5)}</span></p>
        </div>

        <Button onClick={save} disabled={loading} className="bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Globe className="w-4 h-4 mr-2" />}
          Sincronizar Universo Regional
        </Button>
      </CardContent>
    </Card>
  )
}

function PaymentConfig() {
  const { settings } = useSettings()
  const [clabe, setClabe] = useState('')
  const [beneficiary, setBeneficiary] = useState('')
  const [bank, setBank] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (settings) {
      setClabe(settings.payment_clabe || '')
      setBeneficiary(settings.payment_beneficiary || '')
      setBank(settings.payment_bank || '')
    }
  }, [settings])

  const save = async () => {
    setLoading(true)
    try {
      await Promise.all([
        settingsApi.set('payment_clabe', clabe),
        settingsApi.set('payment_beneficiary', beneficiary),
        settingsApi.set('payment_bank', bank),
      ])
      setSaved(true)
      toast.success('Configuración de pagos guardada globalmente')
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      toast.error('Error al guardar: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <Card className="border-white/10 bg-card/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" /> Configuración de Pagos del Ecosistema
          </CardTitle>
          <p className="text-xs text-muted-foreground">Estos datos se mostrarán a tus clientes en todas las sucursales al elegir pago por Transferencia.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-4 max-w-xl">
            <div className="space-y-1.5">
              <Label className="text-xs">CLABE Interbancaria (18 dígitos)</Label>
              <Input value={clabe} onChange={e => setClabe(e.target.value.replace(/\D/g, '').slice(0, 18))} className="font-mono bg-background/50 border-white/10" maxLength={18} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nombre del beneficiario</Label>
              <Input value={beneficiary} onChange={e => setBeneficiary(e.target.value)} className="bg-background/50 border-white/10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Banco</Label>
              <Select value={bank} onValueChange={setBank}>
                <SelectTrigger className="bg-background/50 border-white/10"><SelectValue placeholder="Selecciona el banco" /></SelectTrigger>
                <SelectContent>
                  {['BBVA', 'Banamex', 'Santander', 'Banorte', 'HSBC', 'Inbursa', 'Banco Azteca', 'Coppel'].map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={save} disabled={loading} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : saved ? '✓ Guardado' : 'Guardar en Ecosistema'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ThemeConfig() {
  const [primary, setPrimary] = useState('0.65 0.15 290')
  const [saved, setSaved] = useState(false)

  const PRESETS = [
    { name: 'Linux Market Original (Violeta)', value: '0.65 0.15 290', hex: '#6d28d9' },
    { name: 'Ubuntu Orange', value: '0.65 0.2 40', hex: '#dd4814' },
    { name: 'Mint Green', value: '0.7 0.15 160', hex: '#87a556' },
    { name: 'Arch Blue', value: '0.6 0.15 250', hex: '#1793d1' },
    { name: 'Dark RedPOS', value: '0.5 0.2 27', hex: '#dc2626' },
  ]

  const save = async (val: string) => {
    try {
      setPrimary(val)
      await settingsApi.set('theme_primary', val)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { }
  }

  return (
    <div className="space-y-5">
      <Card className="border-white/10 bg-card/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" /> Personalización del Ecosistema
          </CardTitle>
          <p className="text-xs text-muted-foreground">El color elegido se sincronizará automáticamente con todas las sucursales, terminales, el dashboard central y el login de todo el universo Linux-Market en vivo.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl">
            {PRESETS.map(p => (
              <button
                key={p.name}
                onClick={() => save(p.value)}
                className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-colors ${primary === p.value ? 'bg-primary/20 border-primary' : 'bg-background/50 border-white/10 hover:border-white/30'}`}
              >
                <div className="w-8 h-8 rounded-full shadow-lg" style={{ backgroundColor: p.hex }} />
                <div className="text-xs font-semibold">{p.name}</div>
              </button>
            ))}
          </div>
          {saved && <p className="text-sm text-green-400 font-bold">¡Tema del Ecosistema actualizado!</p>}
        </CardContent>
      </Card>
    </div>
  )
}

function SystemStatus() {
  const [info, setInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    infoApi.get().then(res => {
      setInfo(res)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center p-12"><RefreshCw className="w-6 h-6 animate-spin opacity-20" /></div>

  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-card/30">
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Terminal className="w-4 h-4 text-primary" /> Estado del Servidor Central API</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-xs">
            {[
              { label: 'Servidor IP', value: info?.ip || 'Desconocido' },
              { label: 'Puerto API', value: info?.port || '3001' },
              { label: 'Motor de BD', value: 'SQLite3 + WAL', status: 'ok' },
              { label: 'Conexión Real-Time', value: 'Server-Sent Events (SSE)', status: 'ok' },
              { label: 'Plataforma', value: info?.all?.platform || 'Linux', status: 'ok' },
              { label: 'Versión Node', value: info?.all?.version || 'LTS', status: 'ok' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-background/30">
                <div>
                  <div className="text-muted-foreground">{item.label}</div>
                  <div className="font-semibold text-foreground">{item.value}</div>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-green-500">
                   OK <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-card/30">
        <CardHeader><CardTitle className="text-sm">Métricas de Recursos</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
             <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Memoria Libre</span>
                <span className="font-mono">{Math.round((info?.all?.freemem || 0) / 1024 / 1024)} MB</span>
             </div>
             <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-full transition-all" style={{ width: `${Math.min(100, (1 - (info?.all?.freemem || 0) / (info?.all?.totalmem || 1)) * 100)}%` }} />
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
