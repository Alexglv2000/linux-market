'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { infoApi, logsApi } from '@/lib/api'
import { Shield, Monitor, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FloatingOrbs } from '@/components/premium-ui'
import { AIAdvisor } from '@/components/ai-advisor'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [forceLogin, setForceLogin] = useState(false)
  const [systemInfo, setSystemInfo] = useState<{ mac: string; platform: string } | null>(null)
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const { login, user } = useAuth()
  const router = useRouter()

  const [isTauri, setIsTauri] = useState(false)

  useEffect(() => {
    try {
      const isLocalHost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        setIsTauri(true)
      } else if (!isLocalHost) {
        // We are on a remote device (tablet, other PC), allow web access
        setIsTauri(false)
      } else {
        // We are on localhost but NOT in Tauri (browser dev mode)
        const timer = setTimeout(() => {
          try {
            if (typeof window !== 'undefined' && !('__TAURI_INTERNALS__' in window)) {
              // Only redirect if absolutely necessary for local security
              // router.push('/install') 
              // Desactivamos el redirect forzado para permitir pruebas en navegador
            }
          } catch (e) {
            console.error('[PageGate] Redirect failed:', e)
          }
        }, 800)
        return () => clearTimeout(timer)
      }
    } catch (err) {
      console.warn('[Environment] Detect failed:', err)
      logsApi.post(err, 'LoginPage:isTauriDetect')
    }


    
    // Redirect if already logged in
    try {
      if (user) {
        router.push('/store/dashboard')
      }
    } catch (e) {
      console.warn('[Session] Restore failed:', e)
      logsApi.post(e, 'LoginPage:SessionRestore')
    }

    // Fetch system info and check API health
    const checkApi = () => {
      try {
        infoApi.get()
          .then((res: any) => {
            if (res) {
              setSystemInfo(res)
              setApiStatus('online')
            }
          })
          .catch((err: any) => {
            console.error('[Login] API probe failed:', err)
            setApiStatus('offline')
          })
      } catch (err) {
        setApiStatus('offline')
      }
    }

    checkApi()
    const interval = setInterval(checkApi, 5000)
    return () => clearInterval(interval)
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await login(username, password, forceLogin)
      
      if (result) {
        router.push('/store/dashboard')
      } else {
        setError('Usuario o contraseña incorrectos')
      }
    } catch (err: any) {
      if (err.message.includes('fetch') || err.message.includes('API error')) {
        setError('Error de conexión: El servidor POS no está respondiendo.')
      } else {
        setError(err.message || 'Error al iniciar sesión. Intenta de nuevo.')
      }
      console.error('[LinuxMarket] Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const [logs, setLogs] = useState('')
  const [showLogs, setShowLogs] = useState(false)

  const handleReanimate = async () => {
    if (!isTauri) return;
    const { invoke } = await import('@tauri-apps/api/core')
    try {
      setApiStatus('checking')
      const res = await invoke<string>('start_server')
      console.log(res)
      setTimeout(() => fetchLogs(), 1500)
    } catch (e: any) {
      console.error(e)
      setError(`Error al reanimar: ${e}`)
      fetchLogs()
    }
  }

  const fetchLogs = async () => {
    if (!isTauri) return;
    const { invoke } = await import('@tauri-apps/api/core')
    try {
      const l = await invoke<string>('get_server_logs')
      setLogs(l)
    } catch (e) {
      setLogs('No se pudieron obtener los logs.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden relative">
      {/* Ultra-Intense Atmospheric Mesh Glows */}
      <div className="fixed inset-0 pointer-events-none -z-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-violet-900/10 via-background to-background" />
        <div className="absolute -top-[20%] -left-[10%] w-[1000px] h-[1000px] bg-violet-500/15 blur-[250px] animate-pulse-slow" />
        <div className="absolute top-1/4 right-[5%] w-[900px] h-[900px] bg-violet-600/15 blur-[280px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-[20%] left-1/4 w-[1100px] h-[1100px] bg-indigo-600/10 blur-[300px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
      </div>

      <FloatingOrbs color="violet" />
      <AIAdvisor />

      <Card className="w-full max-w-md shadow-2xl border-white/5 bg-card/80 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-forwards relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary animate-gradient shrink-0" />
        
        <CardHeader className="text-center space-y-4 pt-8">
          <div className="mx-auto w-28 h-28 bg-transparent flex items-center justify-center p-2 group hover:scale-105 transition-transform duration-500">
            <img 
              src="/iconolinuxmarket.png" 
              alt="Linux Market Logo" 
              className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all group-hover:scale-110 duration-500" 
            />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">Linux-Market</CardTitle>
            <CardDescription className="text-[10px] font-black text-primary/80 uppercase tracking-[0.25em] px-2 animate-pulse">
              Software para Linux · Soluciones Inmediatas
            </CardDescription>
          </div>
          
          {systemInfo && isTauri ? (
            <div className="mx-auto mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary uppercase tracking-widest">
              <Monitor className="w-3 h-3" />
              Hardware de Acceso: <span className="font-mono text-[11px] font-black tracking-normal ml-1">{systemInfo.mac}</span>
            </div>
          ) : (
            <div className="mx-auto mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-500 uppercase tracking-widest">
              <Globe className="w-3 h-3" />
              Terminal Remota · Acceso Web
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs uppercase tracking-widest text-muted-foreground ml-1">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-12 bg-background/50 border-white/10 focus:ring-primary/50 transition-all rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground ml-1">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-background/50 border-white/10 focus:ring-primary/50 transition-all rounded-xl"
              />
            </div>
            {error && (
              <div className="text-xs font-medium text-destructive bg-destructive/10 px-4 py-3 rounded-xl border border-destructive/20 animate-shake whitespace-pre-wrap">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/25 rounded-xl transition-all active:scale-[0.98]" 
              disabled={isLoading || apiStatus !== 'online'}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Iniciando sesión...
                </div>
              ) : 'Iniciar Sesión'}
            </Button>

            {isTauri && (
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="force-login" 
                    checked={forceLogin} 
                    onCheckedChange={setForceLogin}
                    className="scale-75 data-[state=checked]:bg-red-500"
                  />
                  <Label htmlFor="force-login" className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold cursor-pointer hover:text-red-400 transition-colors">
                    {forceLogin ? 'Modo Forzado Activo' : 'Forzar Reset Hardware'}
                  </Label>
                </div>
              </div>
            )}
          </form>

          {isTauri && (
            <div className={cn(
              "p-4 bg-muted/30 rounded-2xl border border-white/5 space-y-3 transition-opacity duration-300",
              showLogs ? "opacity-30 pointer-events-none" : "opacity-100"
            )}>
               <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                 <Shield className="w-3 h-3" /> Credenciales de acceso
               </div>
               <div className="grid grid-cols-2 gap-2 text-xs">
                 <div className="p-2 rounded-lg bg-background/50 border border-white/5">
                   <p className="text-[10px] text-primary/70 font-bold mb-0.5">ADMIN</p>
                   <p className="font-mono">admin / admin123</p>
                 </div>
                 <div className="p-2 rounded-lg bg-background/50 border border-white/5">
                   <p className="text-[10px] text-accent/70 font-bold mb-0.5">CAJERO</p>
                   <p className="font-mono">cajero / cajero123</p>
                 </div>
               </div>
               
               <div className="pt-2 border-t border-white/5">
                 <p className="text-[9px] text-muted-foreground/60 leading-relaxed font-medium">
                   <span className="text-red-500/80 font-bold">RESCATE:</span> Si olvidaste tu contraseña o estás bloqueado, usa el usuario <span className="text-primary/80 font-bold">admin</span> con la <span className="text-primary/80 font-bold italic">Master Key del sistema</span>.
                 </p>
               </div>
            </div>
          )}
          
          {apiStatus !== 'checking' && (
            <div className="pt-2 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-bold">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    apiStatus === 'online' ? "bg-green-500 animate-pulse" : "bg-red-500"
                  )} />
                  <span>
                    SERVICIO: {apiStatus === 'online' ? 'EN LÍNEA' : 'DESCONECTADO'} 
                  </span>
                </div>
                <span>v1.2.0-PRO</span>
              </div>
              
              {apiStatus === 'offline' && isTauri && (
                <div className="flex flex-col items-center gap-4 mt-2">
                  <div className="w-full flex items-center justify-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-10 text-[9px] font-black uppercase tracking-widest border-primary/30 hover:bg-primary/20 hover:text-primary transition-all rounded-xl gap-2 shadow-lg shadow-primary/10"
                      onClick={handleReanimate}
                    >
                      <Shield className="w-4 h-4" /> Reanimar Servicio
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground rounded-xl"
                      onClick={() => {
                        setShowLogs(!showLogs)
                        if (!showLogs) fetchLogs()
                      }}
                    >
                      {showLogs ? 'Ocultar Logs' : 'Ver Logs'}
                    </Button>
                  </div>
                  
                  {showLogs && (
                    <div className="w-full bg-black/80 rounded-xl border border-white/10 p-3 font-mono text-[9px] text-green-400 overflow-hidden animate-in zoom-in-95 duration-200">
                      <div className="mb-2 text-white/40 uppercase tracking-tighter flex items-center justify-between">
                        <span>Reporte de Diagnóstico</span>
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                        </div>
                      </div>
                      <div className="max-h-40 overflow-y-auto custom-scrollbar">
                        <pre className="whitespace-pre-wrap">{logs || 'Esperando logs...'}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  )
}
