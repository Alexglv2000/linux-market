'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Store, Cloud } from 'lucide-react'
import Link from 'next/link'

export default function CentralRegisterPage() {
  const [formData, setFormData] = useState({
    storeName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setIsLoading(true)

    try {
      // Persist account in the central registry (localStorage-backed, client-only)
      const accountsRaw = localStorage.getItem('linuxmarket_central_accounts')
      const accounts: Array<{ email: string; password: string; storeName: string; ownerName: string }> =
        accountsRaw ? JSON.parse(accountsRaw) : []

      // Prevent duplicate emails
      if (accounts.some(a => a.email === formData.email)) {
        setError('Ya existe una cuenta con ese email')
        setIsLoading(false)
        return
      }

      accounts.push({
        email: formData.email,
        password: formData.password,
        storeName: formData.storeName,
        ownerName: formData.ownerName,
      })
      localStorage.setItem('linuxmarket_central_accounts', JSON.stringify(accounts))
      localStorage.setItem('linuxmarket_central_user', JSON.stringify({
        email: formData.email,
        storeName: formData.storeName,
        ownerName: formData.ownerName,
      }))
      router.push('/central/dashboard')
    } catch (err) {
      setError('Error al registrar la tienda')
      console.error('[v0] Central registration error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-12">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center relative">
            <Store className="w-8 h-8 text-primary-foreground" />
            <Cloud className="w-5 h-5 text-primary-foreground absolute -top-1 -right-1" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-balance">Registrar mi Tienda</CardTitle>
            <CardDescription className="text-base mt-2">
              Conecta tu tienda a la plataforma central de Linux-Market
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Nombre de la Tienda</Label>
                <Input
                  id="storeName"
                  placeholder="Mi Tienda de Impresoras"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerName">Nombre del Propietario</Label>
                <Input
                  id="ownerName"
                  placeholder="Alexis Gabriel Lugo Villeda"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  required
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  autoComplete="email"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+504 9999-9999"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  autoComplete="new-password"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirma tu contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  autoComplete="new-password"
                  className="h-11"
                />
              </div>
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
              {isLoading ? 'Registrando...' : 'Registrar Tienda'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link href="/central/login" className="text-primary font-medium hover:underline">
                Iniciar sesión
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
              ← Volver al inicio
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
