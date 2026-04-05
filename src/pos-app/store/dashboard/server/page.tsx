'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Wifi, Monitor, Copy, CheckCircle2, AlertCircle,
  Globe, Server, Users, RefreshCw, Signal
} from 'lucide-react'
import { infoApi } from '@/lib/api'

export default function ServerPage() {
  const [ip, setIp] = useState<string>('Detectando...')
  const [port, setPort] = useState<string>('3001')
  const [copied, setCopied] = useState<string | null>(null)
  const [online, setOnline] = useState(true)

  useEffect(() => {
    // Fetch the actual server details from the backend
    const fetchServerInfo = async () => {
      try {
        const info = await infoApi.get()
        if (info.ip) setIp(info.ip)
        if (info.port) setPort(info.port.toString())
      } catch (err) {
        console.error('Error fetching server info:', err)
        // Fallback
        const hostname = window.location.hostname
        const portNum = window.location.port || '3001'
        setIp(hostname === 'localhost' || hostname === '127.0.0.1' ? '192.168.1.X' : hostname)
        setPort(portNum === '3000' ? '3001' : portNum) // Ensure default prod port
      }
    }
    
    fetchServerInfo()

    setOnline(navigator.onLine)
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const serverUrl = `http://${ip}:${port}`
  const loginUrl = `http://${ip}:${port}/store/login`

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Servidor Local</h1>
        <p className="text-muted-foreground mt-1">
          Comparte esta dirección con tus cajeros para que accedan desde sus equipos
        </p>
      </div>

      {/* Estado del servidor */}
      <Card className={`border-2 ${online ? 'border-green-500/40 bg-green-500/5' : 'border-destructive/40 bg-destructive/5'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${online ? 'bg-green-500/20' : 'bg-destructive/20'}`}>
              <Signal className={`w-7 h-7 ${online ? 'text-green-500' : 'text-destructive'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">
                  {online ? 'Servidor Activo' : 'Sin Conexión de Red'}
                </span>
                <Badge className={online ? 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30' : 'bg-destructive/20 text-destructive border-destructive/30'}>
                  <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${online ? 'bg-green-500 animate-pulse' : 'bg-destructive'}`} />
                  {online ? 'En línea' : 'Offline'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {online
                  ? 'Los cajeros pueden conectarse desde cualquier equipo en la misma red WiFi o LAN'
                  : 'Verifica que este equipo esté conectado a la red local'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dirección del servidor */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* URL completa */}
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              Dirección del Sistema
            </CardTitle>
            <CardDescription>Los cajeros abren esta URL en su navegador</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-3 border border-border">
              <code className="text-sm font-mono font-bold text-primary flex-1 select-all break-all">
                {loginUrl}
              </code>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                onClick={() => copyToClipboard(loginUrl, 'login')}
              >
                {copied === 'login'
                  ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                  : <Copy className="w-4 h-4" />
                }
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Esta URL lleva directamente a la pantalla de inicio de sesión del POS.
            </p>
          </CardContent>
        </Card>

        {/* IP y Puerto por separado */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              Detalles de Conexión
            </CardTitle>
            <CardDescription>Datos individuales de la red</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/40 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Dirección IP</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm font-mono font-bold">{ip}</code>
                  <Button
                    size="icon" variant="ghost" className="h-6 w-6"
                    onClick={() => copyToClipboard(ip, 'ip')}
                  >
                    {copied === 'ip'
                      ? <CheckCircle2 className="w-3 h-3 text-green-500" />
                      : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
              <div className="bg-muted/40 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Puerto</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm font-mono font-bold">{port}</code>
                  <Button
                    size="icon" variant="ghost" className="h-6 w-6"
                    onClick={() => copyToClipboard(port, 'port')}
                  >
                    {copied === 'port'
                      ? <CheckCircle2 className="w-3 h-3 text-green-500" />
                      : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Todos los equipos deben estar en la misma red WiFi o LAN
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instrucciones para cajeros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            ¿Cómo conectan los cajeros?
          </CardTitle>
          <CardDescription>
            Comparte estas instrucciones con cada cajero o mesero
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                step: 1,
                icon: Wifi,
                title: 'Conectarse al WiFi',
                desc: 'El cajero debe conectar su equipo (PC, tablet o celular) a la misma red WiFi o cable LAN que este servidor.',
                color: 'from-violet-500 to-purple-600'
              },
              {
                step: 2,
                icon: Globe,
                title: 'Abrir el navegador',
                desc: `Abrir Chrome, Firefox o cualquier navegador y escribir en la barra de direcciones:\n${loginUrl}`,
                color: 'from-blue-500 to-cyan-600',
                highlight: loginUrl
              },
              {
                step: 3,
                icon: Monitor,
                title: 'Iniciar sesión',
                desc: 'Ingresar usuario y contraseña asignados. El cajero verá únicamente el Punto de Venta.',
                color: 'from-green-500 to-emerald-600'
              },
            ].map(({ step, icon: Icon, title, desc, color, highlight }) => (
              <div key={step} className="relative p-4 rounded-2xl border border-border bg-muted/20 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-sm`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                    {step}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">{title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc.split('\n')[0]}</p>
                  {highlight && (
                    <div
                      className="mt-2 flex items-center gap-1.5 bg-background rounded-lg px-2 py-1.5 border border-border cursor-pointer group"
                      onClick={() => copyToClipboard(highlight, `step-${step}`)}
                    >
                      <code className="text-xs font-mono text-primary flex-1 truncate">{highlight}</code>
                      {copied === `step-${step}`
                        ? <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                        : <Copy className="w-3 h-3 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                      }
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comando para verificar desde terminal */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            ¿El servidor no arranca? Verifica con este comando
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-[#0a0a0a] rounded-xl p-4 font-mono text-xs border border-white/10 space-y-1.5">
            <div>
              <span className="text-green-400">$</span>{' '}
              <span className="text-slate-300">pnpm dev</span>
              <span className="text-slate-500 ml-2"># Iniciar servidor en puerto {port}</span>
            </div>
            <div>
              <span className="text-green-400">$</span>{' '}
              <span className="text-slate-300">ip addr show</span>
              <span className="text-slate-500 ml-2"># Ver todas las IPs del equipo</span>
            </div>
            <div>
              <span className="text-green-400">$</span>{' '}
              <span className="text-slate-300">hostname -I</span>
              <span className="text-slate-500 ml-2"># Forma rápida de ver tu IP local</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Asegúrate de ejecutar el servidor con{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">pnpm dev -- --hostname 0.0.0.0</code>{' '}
            para que sea accesible desde otros equipos (o usa la variable{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">HOST=0.0.0.0</code>).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
