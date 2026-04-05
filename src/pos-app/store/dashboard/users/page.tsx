'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/lib/auth-context'
import { usersApi } from '@/lib/api'
import { Users, Plus, Key, Trash2, Eye, EyeOff, Shield, AlertTriangle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const ROLE_LABELS: Record<string, string> = {
  cajero: 'Cajero',
  admin_sucursal: 'Admin Sucursal',
  admin_celula: 'Admin Célula',
  admin_general: 'Admin General',
}

const ROLE_COLORS: Record<string, string> = {
  cajero: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  admin_sucursal: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  admin_celula: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  admin_general: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    role: 'cajero',
  })

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await usersApi.getAll()
      setUsers(data)
    } catch {
      toast.error('Error loading users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  const resetForm = () => {
    setFormData({ username: '', name: '', email: '', password: '', role: 'cajero' })
    setEditingUser(null)
    setShowPassword(false)
  }

  const openEdit = (u: any) => {
    setEditingUser(u)
    setFormData({ username: u.username, name: u.name, email: u.email, password: '', role: u.role })
    setIsDialogOpen(true)
  }

  const saveUser = async () => {
    if (!formData.username || !formData.name) {
      toast.error('Usuario y nombre son obligatorios')
      return
    }
    if (!editingUser && !formData.password) {
      toast.error('La contraseña es obligatoria para usuarios nuevos')
      return
    }
    if (formData.password && formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setSaving(true)
    try {
      if (editingUser?.id) {
        await usersApi.update(editingUser.id, {
          username: formData.username,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          ...(formData.password && { password: formData.password })
        })
        toast.success('Usuario actualizado')
      } else {
        await usersApi.create({
          username: formData.username,
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          sucursalId: currentUser?.sucursalId,
          celulaId: currentUser?.celulaId,
        })
        toast.success('Usuario creado exitosamente')
      }
      setIsDialogOpen(false)
      resetForm()
      loadUsers()
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar el usuario')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (u: any) => {
    if (u.id === currentUser?.id) {
      toast.error('No puedes desactivarte a ti mismo')
      return
    }
    try {
      await usersApi.update(u.id, { isActive: !u.isActive })
      toast.success(u.isActive ? 'Usuario desactivado' : 'Usuario activado')
      loadUsers()
    } catch (e: any) { toast.error(e.message) }
  }

  const deleteUser = async (u: any) => {
    if (u.id === currentUser?.id) {
      toast.error('No puedes eliminar tu propia cuenta')
      return
    }
    if (!confirm(`¿Desactivar al usuario "${u.name}"?`)) return
    try {
      await usersApi.update(u.id, { isActive: false })
      toast.success('Usuario desactivado')
      loadUsers()
    } catch (e: any) { toast.error(e.message) }
  }

  const totalUsers = users.length
  const activeUsers = users.filter(u => u.isActive).length

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl border border-primary/20">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-black tracking-tight">Gestión de Personal</h1>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-14">
            Control de accesos y roles de la sucursal
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={isDialogOpen} onOpenChange={open => { setIsDialogOpen(open); if (!open) resetForm() }}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-11 px-6 rounded-xl font-bold shadow-xl shadow-primary/20 bg-primary hover:opacity-90 active:scale-95 transition-all">
                <Plus className="w-5 h-5" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
              <DialogDescription>
                {editingUser ? 'Modifica los datos del usuario' : 'Crea un nuevo acceso para tu equipo'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nombre de usuario *</Label>
                  <Input
                    value={formData.username}
                    onChange={e => setFormData(p => ({ ...p, username: e.target.value.toLowerCase().trim() }))}
                    placeholder="cajero1"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Nombre completo *</Label>
                  <Input
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="Juan Pérez"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  placeholder="juan@tienda.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Contraseña{' '}
                  {editingUser && <span className="text-xs text-muted-foreground">(dejar vacío para no cambiar)</span>}
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                    placeholder={editingUser ? '••••••' : 'Mínimo 6 caracteres'}
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowPassword(p => !p)}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Rol</Label>
                <Select value={formData.role} onValueChange={v => setFormData(p => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cajero">Cajero — solo acceso al POS</SelectItem>
                    <SelectItem value="almacenista">Almacén — importaciones e inventario</SelectItem>
                    <SelectItem value="admin_sucursal">Admin Sucursal — inventario + reportes</SelectItem>
                    <SelectItem value="admin_celula">Admin Célula — gestión de usuarios</SelectItem>
                    <SelectItem value="admin_general">Admin General — acceso completo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>Cancelar</Button>
              <Button onClick={saveUser} disabled={saving}>
                {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingUser ? 'Actualizar' : 'Crear Usuario'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Total Equipo', value: totalUsers, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Accesos Activos', value: activeUsers, icon: Shield, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Cuentas Inactivas', value: totalUsers - activeUsers, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map(stat => (
          <Card key={stat.label} className="card-hover border-white/5 bg-card/40 backdrop-blur-md overflow-hidden relative group">
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} blur-3xl -mr-12 -mt-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</CardTitle>
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tighter">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">Colaboradores</h2>
            <Badge variant="secondary" className="rounded-lg">{totalUsers}</Badge>
          </div>
          <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-white/5">
             <Button 
               size="sm" 
               variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
               className="h-8 rounded-lg text-xs"
               onClick={() => setViewMode('list')}
             >Lista</Button>
             <Button 
               size="sm" 
               variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
               className="h-8 rounded-lg text-xs"
               onClick={() => setViewMode('grid')}
             >Cuadrícula</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="w-10 h-10 animate-spin text-primary/40" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Sincronizando equipo...</p>
          </div>
        ) : users.length === 0 ? (
          <Card className="border-dashed border-white/10 bg-card/30">
            <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Users className="w-16 h-16 mb-4 opacity-10" />
              <p className="text-lg font-bold">No hay usuarios registrados</p>
              <p className="text-sm opacity-60">Comienza agregando un nuevo colaborador</p>
            </CardContent>
          </Card>
        ) : (
          <div className={cn(
            "grid gap-4 transition-all duration-500",
            viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          )}>
            {users.map(u => (
              <div 
                key={u.id} 
                className={cn(
                  "group relative overflow-hidden flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                  u.isActive 
                    ? "bg-card/50 border-white/5 hover:border-primary/20 hover:bg-card/80 hover:shadow-2xl hover:shadow-primary/5" 
                    : "bg-muted/10 border-white/5 grayscale opacity-60"
                )}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="relative">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 transition-transform group-hover:scale-110 duration-500 shadow-inner",
                      u.isActive ? "bg-gradient-to-br from-primary to-accent text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {u.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    {u.isActive && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-background ring-2 ring-green-500/20 shadow-lg shadow-green-500/50" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-base truncate group-hover:text-primary transition-colors">{u.name}</p>
                      {u.id === currentUser?.id && (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] py-0 px-1.5 h-4 font-bold uppercase">Tú</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] font-bold text-muted-foreground font-mono uppercase tracking-widest">{u.username}</p>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      <p className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        ROLE_COLORS[u.role]?.split(' ')[1]?.replace('text-', 'text-') || 'text-muted-foreground'
                      )}>
                        {ROLE_LABELS[u.role] || u.role}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {u.id !== currentUser?.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 rounded-xl text-primary hover:bg-primary/10 active:scale-95 transition-all"
                        onClick={() => openEdit(u)}
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10 active:scale-95 transition-all"
                        onClick={() => deleteUser(u)}
                        disabled={!u.isActive}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <div className="ml-2 pl-2 border-l border-white/5">
                         <Switch
                           checked={u.isActive}
                           onCheckedChange={() => toggleActive(u)}
                           className="scale-90 data-[state=checked]:bg-green-500"
                         />
                      </div>
                    </div>
                  )}
                  {u.id === currentUser?.id && (
                    <Badge variant="outline" className="opacity-40 font-mono text-[9px]">SISTEMA</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
