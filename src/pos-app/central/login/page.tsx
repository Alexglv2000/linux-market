'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Store, Cloud } from 'lucide-react'
import Link from 'next/link'

export default function CentralLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Check registered accounts from localStorage registry, or fall back to demo
      const accountsRaw = localStorage.getItem('linuxmarket_central_accounts')
      const accounts: Array<{ email: string; password: string; storeName: string; ownerName: string }> =
        accountsRaw ? JSON.parse(accountsRaw) : []

      // Demo account always works
      const isDemoLogin = email === 'admin@linuxmarket.com' && password === 'admin123'
      const match = accounts.find(a => a.email === email && a.password === password)

      if (isDemoLogin || match) {
        localStorage.setItem(
          'linuxmarket_central_user',
          JSON.stringify({
            email,
            storeName: match?.storeName || 'Demo Store',
            ownerName: match?.ownerName || 'Admin',
          })
        )
        router.push('/central/dashboard')
      } else {
        setError('Email o contraseña incorrectos')
      }
    } catch (err) {
      setError('Error al iniciar sesión')
      console.error('[v0] Central login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center relative">
            <Store className="w-8 h-8 text-primary-foreground" />
            <Cloud className="w-5 h-5 text-primary-foreground absolute -top-1 -right-1" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-balance">Linux-Market Central</CardTitle>
            <CardDescription className="text-base mt-2">
              Plataforma de gestión centralizada
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link href="/central/forgot-password" className="text-xs text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-11"
              />
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full h-11 text-base" 
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link href="/central/register" className="text-primary font-medium hover:underline">
                Registrar mi tienda
              </Link>
            </p>
          </div>
          <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <p className="font-medium mb-1">Credenciales de demo:</p>
            <p>Email: <span className="font-mono">admin@linuxmarket.com</span></p>
            <p>Contraseña: <span className="font-mono">admin123</span></p>
          </div>
          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
              ← Volver al inicio
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
