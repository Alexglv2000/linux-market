'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useSettings } from '@/lib/settings-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Store, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  ArrowLeftRight,
  FileText,
  Wifi,
  PackageCheck,
  ClipboardList,
  Monitor,
  Shield,
  RefreshCw,
  X
} from 'lucide-react'
import { salesApi, transfersApi, productsApi, infoApi, settingsApi, statsApi } from '@/lib/api'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { HardwareDetector } from '@/components/hardware-detector'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { BarChart3 as ChartIcon, User, Star, Award, TrendingUp } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const navigation = [
  { name: 'Panel Principal', href: '/store/dashboard', icon: BarChart3, roles: ['cajero', 'almacenista', 'admin_sucursal', 'admin_celula', 'admin_general'] },
  { name: 'Punto de Venta', href: '/store/dashboard/pos', icon: ShoppingCart, roles: ['cajero'] },
  { name: 'Modo Autocobro', href: '/store/dashboard/pos/kiosk', icon: Monitor, roles: ['cajero'] },
  { name: 'Inventario', href: '/store/dashboard/inventory', icon: Package, roles: ['almacenista', 'admin_sucursal', 'admin_celula', 'admin_general'] },
  { name: 'Transferencias', href: '/store/dashboard/transfers', icon: ArrowLeftRight, roles: ['almacenista', 'admin_sucursal', 'admin_celula', 'admin_general'] },
  { name: 'Usuarios', href: '/store/dashboard/users', icon: Users, roles: ['admin_celula', 'admin_general'] },
  { name: 'Reportes', href: '/store/dashboard/reports', icon: FileText, roles: ['admin_sucursal', 'admin_celula', 'admin_general'] },
  { name: 'Configuración', href: '/store/dashboard/settings', icon: Settings, roles: ['admin_general'] },
  { name: 'Servidor', href: '/store/dashboard/server', icon: Wifi, roles: ['admin_general'] },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout, updateProfile, isLoading } = useAuth()
  const { settings } = useSettings()
  const router = useRouter()
  const pathname = usePathname()
  const [performance, setPerformance] = useState({ primary: 0, secondary: 0 })
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Profile update states
  const [profileUsername, setProfileUsername] = useState(user?.username || '')
  const [profileCurrentPassword, setProfileCurrentPassword] = useState('')
  const [profileNewPassword, setProfileNewPassword] = useState('')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  const handleUpdateProfile = async () => {
    if (!user || !profileCurrentPassword) {
      toast.error('La contraseña actual es obligatoria para autorizar cambios.')
      return
    }

    setIsUpdatingProfile(true)
    try {
      const { authApi } = await import('@/lib/api')
      const result = await authApi.updateProfile({
        id: user.id as number,
        currentPassword: profileCurrentPassword,
        newUsername: profileUsername !== user.username ? profileUsername : undefined,
        newPassword: profileNewPassword || undefined
      })

      if (result.user) {
        updateProfile(result.user)
        toast.success('Perfil actualizado correctamente. Las nuevas credenciales ya están activas.')
        setProfileCurrentPassword('')
        setProfileNewPassword('')
      }
    } catch (e: any) {
      toast.error(e.message || 'Error al actualizar el perfil')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  useEffect(() => {
    try {
      if (user) {
        // Usar statsApi para obtener conteos exactos sin límites de paginación
        statsApi.get({ userId: user.id as number })
          .then(res => {
            try {
              if (user.role === 'cajero') {
                setPerformance(prev => ({ ...prev, primary: res.salesToday || 0 }))
              } else if (user.role === 'almacenista') {
                setPerformance(prev => ({ ...prev, secondary: res.lowStock || 0 }))
                transfersApi.getAll()
                  .then(tr => {
                    if (Array.isArray(tr)) {
                      setPerformance(prev => ({ ...prev, primary: tr.filter((t: any) => t.userId === (user.id as number)).length }))
                    }
                  }).catch(() => {})
              }
            } catch (inner) {
              console.warn('[Performance] Internal crash:', inner)
            }
          })
          .catch(() => {})
      }
    } catch (err) {
      console.warn('[Layout] Stats effect failed:', err)
    }
  }, [user])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/store/login')
    }
  }, [user, isLoading, router])

  // ─── Hardware Authentication Gate ──────────────────────────────
  const [isHardwareAuthorized, setIsHardwareAuthorized] = useState<boolean | null>(null)
  const [macDetected, setMacDetected] = useState('')
  const [macAllowed, setMacAllowed] = useState('')
  const [isCheckingHardware, setIsCheckingHardware] = useState(true)

  const checkHardware = async () => {
    try {
      setIsCheckingHardware(true)
      const info = await infoApi.get()
      if (info) {
        setMacDetected(info.mac || 'SINFIRM#')
        const rows = await settingsApi.get()
        const allowed = rows?.allowed_mac || 'ANY'
        setMacAllowed(allowed)

        if (allowed === 'ANY' || allowed === 'auto') {
          setIsHardwareAuthorized(true)
        } else {
          setIsHardwareAuthorized(info.mac === allowed)
        }
      } else {
        setIsHardwareAuthorized(true) // Fallback permissivo si la API falla pero estamos logueados
      }
    } catch (e) {
      console.error('[HardwareGate] Error:', e)
      setIsHardwareAuthorized(true) // No bloquear al usuario si el servidor de info falla
    } finally {
      setIsCheckingHardware(false)
    }
  }

  useEffect(() => {
    checkHardware()
  }, [])

  if (isCheckingHardware || isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-white p-2 rounded-2xl flex items-center justify-center mx-auto animate-pulse shadow-2xl">
            <img src="/iconolinuxmarket.png" className="w-10 h-10 object-contain" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Validando Núcleo...</p>
        </div>
      </div>
    )
  }

  if (isHardwareAuthorized === false) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-red-500/30 selection:text-red-200">
        {/* Premium Background Atmosphere */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-600/15 blur-[140px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-red-900/10 blur-[140px] animate-pulse-slow" style={{ animationDelay: '3s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-red-950/5 blur-[120px]" />
        </div>
        
        <div className="max-w-2xl w-full glass-card border-red-500/20 p-12 text-center space-y-10 animate-in zoom-in-95 fade-in duration-1000 relative">
           {/* Decorative Scanline */}
           <div className="absolute inset-0 scan-effect pointer-events-none opacity-30 rounded-3xl" />
           
           <div className="relative">
             <div className="w-36 h-36 bg-red-500/5 rounded-full flex items-center justify-center mx-auto border border-red-500/10 shadow-[0_0_80px_rgba(239,68,68,0.05)] group">
                <Shield className="w-20 h-20 text-red-500 animate-pulse group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 rounded-full border border-red-500/20 animate-ping opacity-20" />
             </div>
           </div>
           
           <div className="space-y-4">
              <div className="inline-block px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-black text-red-400 uppercase tracking-[0.4em] mb-2">
                 Protocolo de Seguridad Activo
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase italic leading-none">
                NÚCLEO <span className="text-red-600">PROTEGIDO</span>
              </h1>
              <div className="h-1.5 w-32 bg-gradient-to-r from-transparent via-red-600 to-transparent mx-auto rounded-full" />
           </div>

           <div className="space-y-5 text-muted-foreground font-medium leading-relaxed max-w-md mx-auto">
              <p className="text-sm md:text-base">
                 El acceso a este sistema está <span className="font-bold text-white">vinculado al silicio</span>. Esta terminal no ha sido autorizada para operar con la base de datos de Linux Market.
              </p>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-red-400/70 border-y border-white/5 py-4">
                 Si este es un equipo nuevo, solicite un <span className="text-red-500">HARDWARE RESET</span> al administrador central.
              </p>
           </div>

           <div className="bg-black/60 p-6 rounded-3xl border border-white/5 space-y-4 shadow-2xl relative group">
              <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-black text-muted-foreground/40 px-1">
                 <div className="flex items-center gap-2">
                    <Monitor className="w-3.5 h-3.5" /> Hardware de Acceso (MAC)
                 </div>
                 <Badge variant="destructive" className="bg-red-600/10 text-red-500 border-red-500/20 text-[8px] font-black px-2.5 py-1">BLOQUEADO</Badge>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-5 rounded-2xl border border-red-500/20 group-hover:border-red-500/40 transition-colors">
                 <code className="text-base font-mono font-black text-white tracking-wider">{macDetected || 'SINFIRM#'}</code>
                 <div className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              </div>
              <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-widest text-left px-1">
                 Detectado en: {new Date().toLocaleString('es-MX')}
              </p>
           </div>

           <div className="flex flex-col sm:flex-row gap-5 pt-4">
              <Button 
                variant="ghost" 
                onClick={logout} 
                className="flex-1 h-16 rounded-2xl border border-white/5 text-xs font-black uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all"
              >
                Cerrar Sesión
              </Button>
              <Button 
                onClick={checkHardware}
                className="flex-1 h-16 rounded-2xl bg-red-600 text-white hover:bg-red-500 shadow-2xl shadow-red-600/30 text-xs font-black uppercase tracking-widest gap-3 active:scale-[0.98] transition-all"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                Revalidar Núcleo
              </Button>
           </div>
        </div>
        
        <div className="mt-12 flex flex-col items-center gap-2">
           <p className="text-[10px] font-black uppercase tracking-[0.6em] text-muted-foreground/20">
              Linux-Market POS v1.2 · Hardware Binding Protocol
           </p>
           <div className="flex gap-4">
              <div className="w-1.5 h-1.5 rounded-full bg-red-900/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-red-900/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-red-900/40" />
           </div>
        </div>
      </div>
    )
  }

  const visibleNavigation = navigation.filter(item => {
    if (!user || !user.role) return false;
    // Seguridad reforzada: El punto de venta es exclusivo para cajero
    if (item.href === '/store/dashboard/pos') {
      return user.role === 'cajero'
    }
    return item.roles.includes(user.role)
  })


  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Mobile Top Header */}
      <header className="lg:hidden h-16 bg-card/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 sticky top-0 z-[60]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white p-1 rounded-xl">
             <img src={settings?.global_logo_url || "/iconolinuxmarket.png"} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-sm tracking-tight">Linux-Market</span>
        </div>
        <div className="flex items-center gap-2">
           <HardwareDetector />
           <ThemeToggle />
           <Button variant="ghost" size="icon" className="h-10 w-10 border border-white/5 rounded-xl ml-1" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
             {isSidebarOpen ? <X className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
           </Button>
        </div>
      </header>

      {/* Sidebar - Responsive Design */}
      <aside className={cn(
        "fixed inset-y-0 left-0 bg-card/95 backdrop-blur-xl border-r border-white/5 shadow-2xl transition-all duration-300 z-[70]",
        "w-64 lg:w-64",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo - Hidden on mobile as it's in header */}
          <div className="hidden lg:flex items-center gap-3 px-5 py-4 border-b border-white/5">
            <div className="w-11 h-11 bg-white p-1 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-black/10 ring-1 ring-border">
              <img src={settings?.global_logo_url || "/iconolinuxmarket.png"} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-black text-base leading-none tracking-tight">Linux-Market</h1>
              <p className="text-[10px] font-bold text-muted-foreground mt-0.5 uppercase tracking-[0.15em]">POS v1.2 Pro</p>
            </div>
            <div className="flex items-center gap-0.5">
              <HardwareDetector />
              <ThemeToggle />
            </div>
          </div>

          {/* User Info */}
          <div className="px-4 py-3 border-b border-white/5">
            <Dialog>
              <DialogTrigger asChild>
                <button className="flex items-center gap-3 w-full p-2.5 rounded-2xl hover:bg-white/5 transition-all text-left group">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                    <span className="text-sm font-black text-white">
                      {(user?.name || 'U').split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{user?.name || 'Empleado'}</p>
                    <p className="text-[10px] font-bold text-primary mt-0.5 uppercase tracking-widest">
                      {user?.role?.replace(/_/g, ' ') || 'Sin Rol'}
                    </p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 shadow-lg shadow-green-500/50" />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Perfil de Empleado
                  </DialogTitle>
                  <DialogDescription>
                    Información de identidad y desempeño en turno.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-black">
                      {(user?.name || 'U').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{user?.name || 'Usuario'}</h3>
                      <p className="text-sm text-muted-foreground uppercase tracking-widest font-mono">ID: EMP-{user?.id?.toString().padStart(4, '0')}</p>
                      <Badge className="mt-1 capitalize">{user.role.replace('_', ' ')}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border bg-card space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {user.role === 'cajero' ? (
                          <><TrendingUp className="w-3.5 h-3.5" /> Ventas hoy</>
                        ) : user.role === 'almacenista' ? (
                          <><ArrowLeftRight className="w-3.5 h-3.5" /> Transferencias</>
                        ) : (
                          <><BarChart3 className="w-3.5 h-3.5" /> Actividad</>
                        )}
                      </div>
                      <p className="text-2xl font-black">{performance.primary}</p>
                    </div>
                    <div className="p-3 rounded-xl border bg-card space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {user.role === 'almacenista' ? (
                          <><Package className="w-3.5 h-3.5" /> Stock Bajo</>
                        ) : (
                          <><Star className="w-3.5 h-3.5" /> Puntuación</>
                        )}
                      </div>
                      <p className="text-2xl font-black text-amber-500">
                        {user.role === 'almacenista' ? performance.secondary : '4.9'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border bg-muted/30 flex items-center gap-3">
                    <Award className="w-8 h-8 text-primary opacity-50" />
                    <p className="text-xs text-muted-foreground italic leading-relaxed">
                      {user?.role === 'cajero' ? (
                        `Buen trabajo ${(user?.name || '').split(' ')[0]}. Tu nivel de ventas hoy es óptimo.`
                      ) : user?.role === 'almacenista' ? (
                        `Gestión de inventario activa. Tienes ${performance.secondary} productos que requieren atención.`
                      ) : (
                        `Panel de administración activo. Supervisando el ecosistema de la sucursal.`
                      )}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 mb-2">
                       <Shield className="w-3.5 h-3.5" /> Seguridad de Cuenta
                    </h4>
                    
                    <div className="grid gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Nuevo Usuario</Label>
                        <Input 
                          value={profileUsername}
                          onChange={e => setProfileUsername(e.target.value)}
                          placeholder={user.username}
                          className="h-10 bg-background/50 border-white/5 rounded-xl text-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Contraseña Actual <span className="text-red-500">*</span></Label>
                        <Input 
                          type="password"
                          value={profileCurrentPassword}
                          onChange={e => setProfileCurrentPassword(e.target.value)}
                          placeholder="Requerida para autorizar..."
                          className="h-10 bg-background/50 border-white/5 rounded-xl text-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Nueva Contraseña</Label>
                        <Input 
                          type="password"
                          value={profileNewPassword}
                          onChange={e => setProfileNewPassword(e.target.value)}
                          placeholder="Mínimo 8 caracteres..."
                          className="h-10 bg-background/50 border-white/5 rounded-xl text-sm"
                        />
                      </div>

                      <Button 
                        onClick={handleUpdateProfile}
                        disabled={isUpdatingProfile || !profileCurrentPassword}
                        className="w-full h-11 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-[0.2em] rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
                      >
                        {isUpdatingProfile ? 'Actualizando...' : 'Guardar Nuevas Credenciales'}
                      </Button>
                      <p className="text-[9px] text-center text-muted-foreground/50 font-bold uppercase tracking-widest">
                        Los cambios se aplicarán al instante.
                      </p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
            {visibleNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all',
                    isActive
                      ? 'bg-white/20'
                      : 'bg-muted/50 group-hover:bg-primary/10'
                  )}>
                    <item.icon className={cn('w-4 h-4', isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary')} />
                  </div>
                  <span>{item.name}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground/60" />}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-white/5 space-y-2">
            <div className="px-2 py-1.5 rounded-xl bg-muted/20 border border-white/5 text-center">
              <span className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-[0.2em]">Linux-Market · {new Date().getFullYear()}</span>
            </div>
            <Button
              onClick={() => { logout(); setIsSidebarOpen(false); }}
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl h-10"
            >
              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="text-sm">Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content - Dynamic Margin */}
      <main className="lg:ml-64 min-h-[calc(100vh-64px)] lg:min-h-screen">
        <div className="w-full">
          {children}
        </div>
      </main>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}
