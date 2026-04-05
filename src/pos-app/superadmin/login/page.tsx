'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Eye, EyeOff, AlertTriangle, Cpu, Lock } from 'lucide-react'
import { FloatingOrbs } from '@/components/premium-ui'
import { AIAdvisor } from '@/components/ai-advisor'

export default function SuperAdminLogin() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [macAddress, setMacAddress] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [accessTime] = useState(new Date().toLocaleString('es-MX'))
  const [isTauri, setIsTauri] = useState(false)

  useEffect(() => {
    // Detectar entorno Tauri para ocultar navegación web
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      setIsTauri(true)
    } else {
      // Redirect if not in Tauri
      const timer = setTimeout(() => {
        if (!('__TAURI_INTERNALS__' in window)) {
          router.push('/install')
        }
      }, 500)
      return () => clearTimeout(timer)
    }

    // Check existing session
    const token = localStorage.getItem('sa_token')
    const mac = localStorage.getItem('sa_mac')
    if (token && mac) {
      router.push('/superadmin/dashboard')
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!macAddress.match(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)) {
      setError('Formato de MAC inválido. Ejemplo: AA:BB:CC:DD:EE:FF')
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/superadmin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, clientMac: macAddress }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        localStorage.setItem('sa_token', data.token)
        localStorage.setItem('sa_mac', macAddress)
        localStorage.setItem('sa_user', JSON.stringify(data.user))
        router.push('/superadmin/dashboard')
      } else {
        setError(data.error || 'Acceso denegado')
      }
    } catch {
      setError('Error de conexión con el servidor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ultra-Intense Atmospheric Mesh Glows (Red-Themed for SuperAdmin) */}
      <div className="fixed inset-0 pointer-events-none -z-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-red-900/10 via-background to-background" />
        <div className="absolute -top-[20%] -left-[10%] w-[1000px] h-[1000px] bg-red-600/15 blur-[250px] animate-pulse-slow" />
        <div className="absolute top-1/4 right-[5%] w-[900px] h-[900px] bg-orange-600/10 blur-[280px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-[20%] left-1/4 w-[1100px] h-[1100px] bg-red-900/15 blur-[300px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
      </div>

      <FloatingOrbs color="orange" />
      <AIAdvisor />

      <div className="w-full max-w-md relative z-10">
        {/* Warning banner */}
        <div className="mb-6 flex items-center gap-3 bg-red-950/50 border border-red-800/50 rounded-xl p-4 text-red-400">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="text-xs">
            <div className="font-bold mb-0.5">ZONA RESTRINGIDA</div>
            <div className="opacity-80">Acceso solo para dispositivos autorizados en .env.local. Todos los intentos son registrados.</div>
          </div>
        </div>

        <Card className="border border-white/10 bg-card/30 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="w-24 h-24 mx-auto mb-4 bg-transparent flex items-center justify-center p-2 group hover:scale-105 transition-transform duration-500">
              <img src="/iconolinuxmarket.png" alt="Logo" className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all group-hover:scale-110 duration-500" />
            </div>
            <CardTitle className="text-2xl font-black">Super Admin</CardTitle>
            <CardDescription className="text-xs">
              Linux-Market · Acceso maestro restringido por MAC
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="mac" className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> Dirección MAC del dispositivo
                </Label>
                <Input
                  id="mac"
                  value={macAddress}
                  onChange={e => setMacAddress(e.target.value)}
                  placeholder="AA:BB:CC:DD:EE:FF"
                  className="font-mono bg-background/50 border-white/10 focus:border-primary/50"
                  required
                />
                <p className="text-[10px] text-muted-foreground">
                  Linux: <code className="bg-muted px-1 rounded">ip link show | grep ether</code>
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs text-muted-foreground">Usuario</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="superadmin"
                  className="bg-background/50 border-white/10 focus:border-primary/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-muted-foreground">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="pr-10 bg-background/50 border-white/10 focus:border-primary/50"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-950/50 border border-red-800/50 rounded-lg p-3 text-red-400 text-xs">
                  <Lock className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-700 to-red-900 hover:opacity-90 shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verificando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Autenticar
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-white/10 text-center">
              <p className="text-[10px] text-muted-foreground">
                Intento registrado · {accessTime}
              </p>
            </div>
          </CardContent>
        </Card>

        {!isTauri && (
          <div className="mt-4 text-center">
            <a href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Volver al inicio
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
