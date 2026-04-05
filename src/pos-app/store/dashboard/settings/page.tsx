'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { usersApi, accountsApi, sucursalesApi, settingsApi } from '@/lib/api'
import {
  Settings, Store, CreditCard, Bell, Shield,
  Save, Building2, Printer, CheckCircle, Info,
  Globe, Laptop, Monitor, Tablet, Key, UserIcon,
  Upload, Image as ImageIcon, HelpCircle, ArrowRightCircle,
  QrCode, HardDrive, CreditCard as CardIcon, PlusCircle, Trash2, Palette
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const { user } = useAuth()

  // Payment settings — safely read localStorage on mount only
  const [clabe, setClabe] = useState('')
  const [beneficiary, setBeneficiary] = useState('')
  const [bank, setBank] = useState('')

  // Store settings
  const [taxRate, setTaxRate] = useState('16')
  const [receiptHeader, setReceiptHeader] = useState('')
  const [receiptFooter, setReceiptFooter] = useState('')
  const [printOnSale, setPrintOnSale] = useState(true)
  const [soundOnSale, setSoundOnSale] = useState(true)
  const [logoUrl, setLogoUrl] = useState('')

  // Appearance settings (Global via Server)
  const [themePrimary, setThemePrimary] = useState('')
  const [themeAccent, setThemeAccent] = useState('')
  const [globalTheme, setGlobalTheme] = useState('dark')
  const [transparentBg, setTransparentBg] = useState(false)
  const [globalLogoUrl, setGlobalLogoUrl] = useState('')
  const [ticketLogoUrl, setTicketLogoUrl] = useState('')
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false)
  const [isDraggingTicket, setIsDraggingTicket] = useState(false)

  // Hardware Lock settings
  const [allowedMac, setAllowedMac] = useState('auto')

  // Profile settings
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Multi-accounts
  const [accounts, setAccounts] = useState<any[]>([])
  const [accName, setAccName] = useState('')
  const [accIdentifier, setAccIdentifier] = useState('')
  const [accType, setAccType] = useState<'banco' | 'terminal'>('banco')
  const [accBank, setAccBank] = useState('')

  const [sucursal, setSucursal] = useState<any>(null)
  const [celula, setCelula] = useState<any>({ name: 'Célula Principal', code: 'CEL001', description: 'Operación Local' })

  const loadData = async () => {
    try {
      const accs = await accountsApi.getAll()
      setAccounts(accs)
      const sucs = await sucursalesApi.getAll()
      if (sucs.length > 0) setSucursal(sucs[0])
      
      const sysSettings = await settingsApi.get()
      setThemePrimary(sysSettings.theme_primary || '')
      setThemeAccent(sysSettings.theme_accent || '')
      setGlobalTheme(sysSettings.global_theme || 'dark')
      setTransparentBg(sysSettings.transparent_bg === 'true')
      setGlobalLogoUrl(sysSettings.global_logo_url || '')
      setTicketLogoUrl(sysSettings.ticket_logo_url || '')
      setAllowedMac(sysSettings.allowed_mac || 'auto')
    } catch {}
  }

  // Load saved settings from localStorage on client only
  useEffect(() => {
    loadData()
    try {
      setClabe(localStorage.getItem('lm_clabe') || '')
      setBeneficiary(localStorage.getItem('lm_beneficiary') || '')
      setBank(localStorage.getItem('lm_bank') || '')
      setTaxRate(localStorage.getItem('lm_tax_rate') || '16')
      setReceiptHeader(localStorage.getItem('lm_receipt_header') || '')
      setReceiptFooter(localStorage.getItem('lm_receipt_footer') || 'Gracias por su compra')
      setPrintOnSale(localStorage.getItem('lm_print_on_sale') !== 'false')
      setSoundOnSale(localStorage.getItem('lm_sound_on_sale') !== 'false')
      setLogoUrl(localStorage.getItem('lm_logo_url') || '')
    } catch {
      // localStorage not available — use defaults
    }
  }, [])

  const savePaymentSettings = () => {
    try {
      if (clabe && clabe.length !== 18) {
        toast.error('La CLABE interbancaria debe tener exactamente 18 dígitos')
        return
      }
      localStorage.setItem('lm_clabe', clabe)
      localStorage.setItem('lm_beneficiary', beneficiary)
      localStorage.setItem('lm_bank', bank)
      toast.success('Configuración de pagos guardada')
    } catch {
      toast.error('No se pudo guardar la configuración')
    }
  }

  const updateSecurity = async () => {
    if (!user?.id) return

    try {
      if (newPassword && newPassword !== confirmPassword) {
        toast.error('Las nuevas contraseñas no coinciden')
        return
      }

      const updates: any = {}
      if (newUsername && newUsername !== user.username) updates.username = newUsername
      if (newPassword) updates.password = newPassword

      if (Object.keys(updates).length === 0) {
        toast.info('No hay cambios para actualizar')
        return
      }

      await usersApi.update(user.id, updates)

      toast.success('Perfil actualizado correctamente. Es posible que debas iniciar sesión de nuevo.')
      
      // Clear fields
      setCurrentPassword('')
      setNewUsername('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toast.error('Error al actualizar el perfil: ' + error.message)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen es muy grande. Máximo 2MB.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleGlobalLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen es muy grande. Máximo 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setGlobalLogoUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const addAccount = async () => {
    if (!accName || !accIdentifier) {
      toast.error('Nombre e identificador son requeridos')
      return
    }
    try {
      await accountsApi.create({
        name: accName,
        type: accType,
        bank: accBank,
        identifier: accIdentifier
      })
      setAccName(''); setAccIdentifier(''); setAccBank('')
      toast.success('Cuenta/Terminal agregada correctamente')
      loadData()
    } catch (e: any) { toast.error(e.message) }
  }

  const deleteAccount = async (id: number) => {
    try {
      await accountsApi.delete(id)
      toast.success('Cuenta eliminada')
      loadData()
    } catch(e: any) { toast.error(e.message) }
  }

  const saveReceiptSettings = () => {
    try {
      const rate = parseFloat(taxRate)
      if (isNaN(rate) || rate < 0 || rate > 100) {
        toast.error('La tasa de IVA debe ser un número entre 0 y 100')
        return
      }
      localStorage.setItem('lm_tax_rate', taxRate)
      localStorage.setItem('lm_receipt_header', receiptHeader)
      localStorage.setItem('lm_receipt_footer', receiptFooter)
      localStorage.setItem('lm_print_on_sale', String(printOnSale))
      localStorage.setItem('lm_sound_on_sale', String(soundOnSale))
      localStorage.setItem('lm_logo_url', logoUrl)
      toast.success('Configuración de recibos y logo guardada')
    } catch {
      toast.error('No se pudo guardar la configuración')
    }
  }

  const saveAppearanceSettings = async () => {
    try {
      if (themePrimary) await settingsApi.set('theme_primary', themePrimary)
      if (themeAccent) await settingsApi.set('theme_accent', themeAccent)
      await settingsApi.set('global_theme', globalTheme)
      await settingsApi.set('transparent_bg', String(transparentBg))
      await settingsApi.set('global_logo_url', globalLogoUrl)
      await settingsApi.set('ticket_logo_url', ticketLogoUrl)
      
      toast.success('Configuración de apariencia y logos guardada. Todos los clientes se sincronizarán.')
    } catch (e: any) {
      toast.error('Error guardando apariencia: ' + e.message)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleLogoDrop = (e: React.DragEvent, type: 'global' | 'ticket') => {
    e.preventDefault()
    e.stopPropagation()
    if (type === 'global') setIsDraggingGlobal(false)
    else setIsDraggingTicket(false)

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        if (type === 'global') setGlobalLogoUrl(base64)
        else setTicketLogoUrl(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" />
          Configuración
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ajustes de la tienda, pagos y preferencias del sistema
        </p>
      </div>

      {/* Quick Guide / Instructions */}
      <Card className="border-primary bg-primary/5 shadow-md">
        <CardHeader className="pb-3 text-primary">
          <CardTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="w-5 h-5 animate-pulse" />
            Guía de Inicio Rápido: ¡Has iniciado Linux-Market!
          </CardTitle>
          <CardDescription className="text-primary/70">Sigue estos pasos para personalizar tu negocio ahora mismo</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex gap-3">
             <ArrowRightCircle className="w-5 h-5 shrink-0 text-primary mt-0.5" />
             <div className="text-xs space-y-1">
               <p className="font-bold">1. Tu Identidad</p>
               <p className="text-muted-foreground">Baja a &quot;Seguridad y Perfil&quot; y cambia tu usuario admin por uno personal.</p>
             </div>
          </div>
          <div className="flex gap-3">
             <ArrowRightCircle className="w-5 h-5 shrink-0 text-primary mt-0.5" />
             <div className="text-xs space-y-1">
               <p className="font-bold">2. El Logo</p>
               <p className="text-muted-foreground">Carga tu logo en &quot;Configuración de Recibos&quot; para que aparezca en tus tickets.</p>
             </div>
          </div>
          <div className="flex gap-3">
             <ArrowRightCircle className="w-5 h-5 shrink-0 text-primary mt-0.5" />
             <div className="text-xs space-y-1">
               <p className="font-bold">3. Catálogo</p>
               <p className="text-muted-foreground">Ve a <span className="underline cursor-pointer" onClick={() => (window.location.href='/store/dashboard/inventory')}>Inventario</span> y borra los productos demo para subir los tuyos.</p>
             </div>
          </div>
          <div className="flex gap-3">
             <ArrowRightCircle className="w-5 h-5 shrink-0 text-primary mt-0.5" />
             <div className="text-xs space-y-1">
               <p className="font-bold">4. Tus Cajeros</p>
               <p className="text-muted-foreground">Crea cuentas para tu personal en la sección de <span className="underline cursor-pointer" onClick={() => (window.location.href='/store/dashboard/users')}>Usuarios</span>.</p>
             </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="w-4 h-4 text-primary" />
            Apariencia Global y Ecosistema
          </CardTitle>
          <CardDescription>
            Personaliza colores, logotipo y apariencia para todos los usuarios simultáneamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Color Principal (HEX)</Label>
              <div className="flex gap-2">
                <Input 
                  type="color" 
                  value={themePrimary} 
                  onChange={e => setThemePrimary(e.target.value)} 
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input 
                  value={themePrimary} 
                  onChange={e => setThemePrimary(e.target.value)} 
                  placeholder="#000000" 
                  className="font-mono flex-1"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label>Color Secundario / Acento (HEX)</Label>
              <div className="flex gap-2">
                <Input 
                  type="color" 
                  value={themeAccent} 
                  onChange={e => setThemeAccent(e.target.value)} 
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input 
                  value={themeAccent} 
                  onChange={e => setThemeAccent(e.target.value)} 
                  placeholder="#FFFFFF" 
                  className="font-mono flex-1"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <Label className="text-sm font-medium">Tema de la interfaz</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Claro u Oscuro para todo el sistema</p>
            </div>
            <select 
              value={globalTheme} 
              onChange={(e) => setGlobalTheme(e.target.value)}
              className="h-9 px-3 rounded-lg border border-input bg-background text-sm"
            >
              <option value="dark">Oscuro (Dark Mode)</option>
              <option value="light">Claro (Light Mode)</option>
            </select>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <Label className="text-sm font-medium">Ventanas Transparentes</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Habilita efectos de transparencia en aplicaciones de escritorio.</p>
            </div>
            <Switch checked={transparentBg} onCheckedChange={setTransparentBg} />
          </div>

          <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-border">
            {/* Logo App */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                Logo Global de la App
              </Label>
              <div 
                onDragOver={handleDragOver}
                onDragEnter={() => setIsDraggingGlobal(true)}
                onDragLeave={() => setIsDraggingGlobal(false)}
                onDrop={(e) => handleLogoDrop(e, 'global')}
                className={cn(
                  "flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer relative",
                  isDraggingGlobal ? "border-primary bg-primary/10" : "border-primary/20 bg-primary/5 hover:border-primary/40"
                )}
              >
                {globalLogoUrl ? (
                  <div className="relative group">
                    <img src={globalLogoUrl} alt="App Global" className="w-20 h-20 object-contain rounded-xl bg-background p-2 shadow-sm" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); setGlobalLogoUrl('') }}
                      className="absolute -top-3 -right-3 bg-destructive text-white p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-xs font-medium">Arrastra el logo de la App aquí</p>
                    <p className="text-[10px] text-muted-foreground">O haz clic para seleccionar</p>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (ev) => setGlobalLogoUrl(ev.target?.result as string)
                      reader.readAsDataURL(file)
                    }
                  }}
                />
              </div>
            </div>

            {/* Logo Ticket */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-primary" />
                Logo de Tikets / Recibos
              </Label>
              <div 
                onDragOver={handleDragOver}
                onDragEnter={() => setIsDraggingTicket(true)}
                onDragLeave={() => setIsDraggingTicket(false)}
                onDrop={(e) => handleLogoDrop(e, 'ticket')}
                className={cn(
                  "flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer relative",
                  isDraggingTicket ? "border-primary bg-primary/10" : "border-primary/20 bg-primary/5 hover:border-primary/40"
                )}
              >
                {ticketLogoUrl ? (
                  <div className="relative group">
                    <img src={ticketLogoUrl} alt="Ticket Logo" className="w-20 h-20 object-contain rounded-xl bg-background p-2 shadow-sm grayscale" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); setTicketLogoUrl('') }}
                      className="absolute -top-3 -right-3 bg-destructive text-white p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-xs font-medium">Arrastra el logo para Recibos aquí</p>
                    <p className="text-[10px] text-muted-foreground">Idealmente blanco y negro</p>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (ev) => setTicketLogoUrl(ev.target?.result as string)
                      reader.readAsDataURL(file)
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <Button onClick={saveAppearanceSettings} className="gap-2 w-full md:w-auto">
            <Save className="w-4 h-4" /> Guardar Apariencia Global
          </Button>
        </CardContent>
      </Card>

      {/* Device Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HardDrive className="w-4 h-4 text-primary" />
            Dispositivos y Hardware
          </CardTitle>
          <CardDescription>Configuración de periféricos para tu local</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                <QrCode className="w-4 h-4 text-primary" />
                Lectores de Barras
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Linux-Market detecta automáticamente cualquier lector USB (HID). Al escanear el SKU de un producto, se agregará al carrito instantáneamente sin usar el mouse.
              </p>
              <Badge variant="outline" className="text-[10px] text-green-500 border-green-500/30">Plug & Play Activado</Badge>
            </div>
            <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Printer className="w-4 h-4 text-primary" />
                Impresoras Térmicas (POS-80)
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Nuestra impresión usa el estándar del sistema operativo. Asegúrate de que tu impresora esté configurada en CUPS (Linux).
              </p>
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30">Compatible ESC/POS</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hardware Security Lock */}
      <Card className="border-red-500/20 bg-red-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-red-500">
            <Shield className="w-4 h-4" />
            Seguridad de Hardware (Hardware Lock)
          </CardTitle>
          <CardDescription>
            Restringe el acceso al servidor únicamente desde un equipo específico mediante su dirección MAC.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between p-4 rounded-xl bg-background border border-border gap-4">
            <div className="space-y-1">
              <p className="text-sm font-bold">Estado del Bloqueo</p>
              <p className="text-xs text-muted-foreground">
                MAC Permitida: <span className="font-mono text-primary font-bold">
                  {allowedMac === 'ANY' ? 'DESACTIVADO (Cualquier equipo puede entrar)' : 
                   (allowedMac === 'auto' ? 'AUTOMÁTICO (Se bloqueará al hardware que use el próximo login)' : allowedMac)}
                </span>
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 md:flex-none"
                onClick={async () => {
                   try {
                     await settingsApi.set('allowed_mac', 'auto');
                     setAllowedMac('auto');
                     toast.success('El bloqueo se reseteará y tomará el hardware del próximo inicio de sesión.');
                   } catch (e: any) { toast.error(e.message) }
                }}
              >
                Resetear a Auto
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                className="flex-1 md:flex-none"
                onClick={async () => {
                   try {
                     await settingsApi.set('allowed_mac', 'ANY');
                     setAllowedMac('ANY');
                     toast.warning('El bloqueo de hardware ha sido deshabilitado. ¡Se recomienda activarlo para producción!');
                   } catch (e: any) { toast.error(e.message) }
                }}
              >
                Deshabilitar
              </Button>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-3">
             <Info className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
             <div className="space-y-1">
               <p className="text-[10px] text-orange-600/90 font-black uppercase tracking-wider">
                 ⚠️ Información Crítica de Seguridad
               </p>
               <p className="text-[10px] text-muted-foreground leading-relaxed">
                 Si habilitas el bloqueo, solo este equipo físico podrá acceder al servidor. Si cambias de equipo o tarjeta de red, quedarás bloqueado.
                 <br />
                 <strong>Nota:</strong> Los usuarios con rol <span className="font-bold text-primary">Admin General</span> (Super Usuarios) siempre pueden entrar aunque el hardware no coincida, permitiéndoles resetear esta configuración en caso de emergencia.
               </p>
             </div>
          </div>
        </CardContent>
      </Card>

      {/* Multiple Accounts & Terminals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CardIcon className="w-4 h-4 text-primary" />
            Cuentas y Terminales de Pago
          </CardTitle>
          <CardDescription>Gestiona tus cuentas bancarias y terminales enlazadas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2 border-b pb-2 italic text-muted-foreground">
               Agregar Nueva Cuenta o Terminal
            </h4>
            <div className="grid md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px]">Tipo</Label>
                <select 
                  value={accType} 
                  onChange={(e: any) => setAccType(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="banco">Banco / Transferencia</option>
                  <option value="terminal">Terminal Bancaria</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Nombre Identificador</Label>
                <Input value={accName} onChange={e => setAccName(e.target.value)} placeholder="Ej: Terminal Principal" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Banco / Marca</Label>
                <Input value={accBank} onChange={e => setAccBank(e.target.value)} placeholder="BBVA, CLIP, etc." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">CLABE / ID Serie</Label>
                <Input value={accIdentifier} onChange={e => setAccIdentifier(e.target.value)} placeholder="Número de cuenta" />
              </div>
            </div>
            <Button onClick={addAccount} className="w-full md:w-auto gap-2" variant="outline">
              <PlusCircle className="w-4 h-4" /> Registrar Cuenta / Terminal
            </Button>
          </div>

          <Separator />

          <div className="grid gap-3">
            {accounts?.map(acc => (
              <div key={acc.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${acc.type === 'terminal' ? 'bg-orange-500/10 text-orange-500' : 'bg-green-500/10 text-green-500'}`}>
                    {acc.type === 'terminal' ? <Monitor className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{acc.name} <Badge variant="secondary" className="text-[10px] ml-1">{acc.type}</Badge></div>
                    <div className="text-[10px] text-muted-foreground font-mono">{acc.bank} — {acc.identifier}</div>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteAccount(acc.id!)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {(!accounts || accounts.length === 0) && (
              <p className="text-center text-xs text-muted-foreground py-4">No has registrado cuentas adicionales aún.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Store Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="w-4 h-4 text-primary" />
            Información de la tienda
          </CardTitle>
          <CardDescription>Datos de la sucursal y célula activa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Sucursal</span>
                <Badge variant="outline" className="text-xs">{sucursal?.code || '...'}</Badge>
              </div>
              <div className="font-semibold">{sucursal?.name || 'Cargando...'}</div>
              <div className="text-xs text-muted-foreground">{sucursal?.address || '—'}</div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Célula</span>
                <Badge variant="outline" className="text-xs">{celula?.code || '...'}</Badge>
              </div>
              <div className="font-semibold">{celula?.name || 'Cargando...'}</div>
              <div className="text-xs text-muted-foreground">{celula?.description || '—'}</div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
            <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Para modificar los datos de sucursal o célula, contacta al Super Administrador del sistema.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="w-4 h-4 text-primary" />
            Configuración de pagos
          </CardTitle>
          <CardDescription>
            Datos bancarios para cobros por transferencia SPEI / CLABE
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bank">Banco</Label>
              <Input
                id="bank"
                value={bank}
                onChange={e => setBank(e.target.value)}
                placeholder="BBVA, Banamex, HSBC..."
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="beneficiary">Beneficiario (nombre en cuenta)</Label>
              <Input
                id="beneficiary"
                value={beneficiary}
                onChange={e => setBeneficiary(e.target.value)}
                placeholder="Nombre del titular"
                className="h-10"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clabe">
              CLABE interbancaria{' '}
              <span className="text-xs text-muted-foreground">(18 dígitos)</span>
            </Label>
            <Input
              id="clabe"
              value={clabe}
              onChange={e => setClabe(e.target.value.replace(/\D/g, '').slice(0, 18))}
              placeholder="000000000000000000"
              className="h-10 font-mono tracking-widest"
              maxLength={18}
            />
            {clabe.length > 0 && clabe.length !== 18 && (
              <p className="text-xs text-destructive">{clabe.length} / 18 dígitos</p>
            )}
            {clabe.length === 18 && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> CLABE válida
              </p>
            )}
          </div>
          <Button onClick={savePaymentSettings} className="gap-2">
            <Save className="w-4 h-4" /> Guardar configuración de pagos
          </Button>
        </CardContent>
      </Card>

      {/* Receipt Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Printer className="w-4 h-4 text-primary" />
            Configuración de recibos
          </CardTitle>
          <CardDescription>
            Personaliza el encabezado y pie de tus tickets de venta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="taxRate">Tasa de IVA (%)</Label>
              <Input
                id="taxRate"
                type="number"
                value={taxRate}
                onChange={e => setTaxRate(e.target.value)}
                placeholder="16"
                min={0}
                max={100}
                step={0.1}
                className="h-10"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="receiptHeader">Encabezado del ticket</Label>
            <Input
              id="receiptHeader"
              value={receiptHeader}
              onChange={e => setReceiptHeader(e.target.value)}
              placeholder="Nombre de tu negocio, eslogan..."
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="receiptFooter">Pie del ticket</Label>
            <Input
              id="receiptFooter"
              value={receiptFooter}
              onChange={e => setReceiptFooter(e.target.value)}
              placeholder="Gracias por su compra"
              className="h-10"
            />
          </div>
          <div className="space-y-4">
            <Label>Logo del Negocio (para tickets)</Label>
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 hover:border-primary/40 transition-all">
              {logoUrl ? (
                <div className="relative group">
                  <img 
                    src={logoUrl} 
                    alt="Logo preview" 
                    className="w-32 h-32 object-contain rounded-xl bg-white p-2 shadow-lg border border-border" 
                  />
                  <div 
                    onClick={() => setLogoUrl('')}
                    className="absolute -top-2 -right-2 bg-destructive text-white p-1 rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform"
                  >
                    <HelpCircle className="w-4 h-4 rotate-45" />
                  </div>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="w-10 h-10 opacity-20" />
                </div>
              )}
              
              <div className="space-y-3 flex-1">
                <p className="text-sm font-medium">Sube tu logo corporativo</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Este logo se imprimirá en el encabezado de cada ticket de venta. Formatos recomendados: PNG o JPG con fondo blanco.
                </p>
                <Input
                  id="logoUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="cursor-pointer file:cursor-pointer file:text-primary file:font-semibold"
                />
              </div>
            </div>
            
            <div className="space-y-1.5 mt-2">
              <Label htmlFor="logoUrl" className="text-xs opacity-50">O usa una URL externa</Label>
              <Input
                id="logoUrl"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                placeholder="https://su-negocio.com/logo.png"
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Imprimir ticket automáticamente</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Abre el diálogo de impresión al completar cada venta</p>
              </div>
              <Switch checked={printOnSale} onCheckedChange={setPrintOnSale} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Sonido al completar venta</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Emite un sonido de confirmación al procesar pagos</p>
              </div>
              <Switch checked={soundOnSale} onCheckedChange={setSoundOnSale} />
            </div>
          </div>

          <Button onClick={saveReceiptSettings} className="gap-2">
            <Save className="w-4 h-4" /> Guardar configuración de recibos
          </Button>
        </CardContent>
      </Card>

      {/* Local Network Access */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="w-4 h-4 text-primary" />
            Red Local y Acceso Web
          </CardTitle>
          <CardDescription>
            Usa esta información para que tus cajeros inicien sesión desde otras computadoras o tablets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 p-4 rounded-xl bg-background border border-border space-y-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Laptop className="w-4 h-4 text-primary" />
                Acceso desde est dispositivo
              </div>
              <div className="bg-muted p-2 rounded font-mono text-xs break-all">
                http://localhost:3000/store/login
              </div>
            </div>
            <div className="flex-1 p-4 rounded-xl bg-background border border-border space-y-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Tablet className="w-4 h-4 text-primary" />
                Acceso desde otros dispositivos
              </div>
              <div className="bg-primary/10 p-2 rounded font-mono text-xs break-all text-primary font-bold">
                http://[TU_IP_LOCAL]:3000/store/login
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold flex items-center gap-2">
              <Info className="w-4 h-4" /> ¿Cómo encontrar tu IP local?
            </Label>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border bg-card text-xs">
                <p className="font-bold mb-1">En Linux / Mac:</p>
                <code className="bg-muted px-1 rounded text-[10px]">hostname -I</code> o <code className="bg-muted px-1 rounded text-[10px]">ip addr</code>
              </div>
              <div className="p-3 rounded-lg border bg-card text-xs">
                <p className="font-bold mb-1">En tu terminal:</p>
                <code className="bg-muted px-1 rounded text-[10px]">ifconfig</code>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground italic">
            Nota: Todos los dispositivos deben estar conectados a la misma red Wi-Fi o cableada.
          </p>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4 text-primary" />
            Seguridad y Perfil
          </CardTitle>
          <CardDescription>Administra tu cuenta de acceso al sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
                <UserIcon className="w-3.5 h-3.5" /> Cambiar Usuario
              </h4>
              <div className="space-y-1.5">
                <Label htmlFor="newUsername">Nuevo Nombre de Usuario</Label>
                <Input
                  id="newUsername"
                  placeholder={user?.username}
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
                <Key className="w-3.5 h-3.5" /> Cambiar Contraseña
              </h4>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Dejar vacío para no cambiar"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword" title="Obligatorio para cualquier cambio">
                Contraseña Actual <span className="text-destructive">*</span>
              </Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Verifica tu identidad"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />
            </div>
            <Button onClick={updateSecurity} disabled={!currentPassword} className="w-full gap-2">
              <Save className="w-4 h-4" /> Aplicar cambios de seguridad
            </Button>
          </div>

          <div className="p-3 rounded-xl bg-muted border border-border flex items-start gap-3 mt-4">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Tu rol actual: <Badge className="text-[10px] h-4">{user?.role?.replace(/_/g, ' ')}</Badge></p>
              <p>Tu ID único: <span className="font-mono">{user?.id}</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
