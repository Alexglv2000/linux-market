'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  ShieldCheck,
  Zap,
  Lock,
  Terminal,
  Cpu,
  Globe,
  Database,
  Users,
  Server,
  Activity,
  Blocks,
  Download,
  MessageCircle,
  X,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { AIAdvisor } from '@/components/ai-advisor'
import { FloatingOrbs } from '@/components/premium-ui'

export default function PublicityLandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [navVisible, setNavVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isTauri, setIsTauri] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      setIsTauri(true)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Smart Hide Logic
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setNavVisible(false)
      } else {
        setNavVisible(true)
      }

      setScrolled(currentScrollY > 20)
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Mobile menu scroll lock
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  const features = [
    {
      title: 'Hardware Lock',
      desc: 'Licencia atada al silicio vía MAC Address. Sin nube, sin intermediarios.',
      icon: ShieldCheck,
      color: 'text-red-500',
      badge: 'NÚCLEO'
    },
    {
      title: 'Sincronización SSE',
      desc: 'Inventario y ventas en tiempo real vía Server-Sent Events entre todas las sucursales.',
      icon: Zap,
      color: 'text-yellow-400',
      badge: 'RED'
    },
    {
      title: 'Cifrado AES-256',
      desc: 'Base de datos local cifrada a nivel militar. Tus datos son solo tuyos.',
      icon: Lock,
      color: 'text-blue-400',
      badge: 'SEGURIDAD'
    },
    {
      title: 'IPC Nativo',
      desc: 'Comunicación directa entre procesos optimizada para el kernel de Linux sin overhead.',
      icon: Terminal,
      color: 'text-indigo-400',
      badge: 'KERNEL'
    },
    {
      title: 'Motor Rust',
      desc: 'Back-end compilado a binario nativo para máximo rendimiento con mínimo consumo.',
      icon: Cpu,
      color: 'text-orange-500',
      badge: 'PERFORMANCE'
    },
    {
      title: 'Offline First',
      desc: 'El sistema opera sin internet. La sincronización ocurre cuando la red vuelve.',
      icon: Globe,
      color: 'text-emerald-400',
      badge: 'RESILIENCIA'
    },
    {
      title: 'SQLite Avanzado',
      desc: 'Consultas de baja latencia con índices optimizados para operaciones de alto volumen.',
      icon: Database,
      color: 'text-cyan-400',
      badge: 'DATOS'
    },
    {
      title: 'Control ACL',
      desc: 'Roles y permisos por capacidades específicas. RBAC real para tu equipo de trabajo.',
      icon: Users,
      color: 'text-pink-400',
      badge: 'ACCESO'
    }
  ]

  const distros = [
    { name: '.deb', dist: 'Ubuntu' },
    { name: 'Debian', dist: '.rpm' },
    { name: 'Fedora', dist: 'RHEL' },
    { name: 'Arch', dist: '.tar.gz' },
    { name: 'openSUSE', dist: 'Mint' },
    { name: 'PopOS', dist: 'Manjaro' },
    { name: 'EndeavourOS', dist: '.deb' }
  ]

  const DebianLogo = () => (
    <img src="/mascots/debian_final.svg" className="w-10 h-10 object-contain" alt="Debian" />
  )

  const FedoraLogo = () => (
    <img src="/fedora.png" className="w-10 h-10 object-contain" alt="Fedora" />
  )

  const ArchLogo = () => (
    <img src="/mascots/arch_final.svg" className="w-10 h-10 object-contain" alt="Arch" />
  )

  return (
    <div className="min-h-screen text-foreground overflow-x-hidden relative bg-background">


      <FloatingOrbs color="violet" />


      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 transform ${navVisible ? 'translate-y-0' : '-translate-y-full'} ${scrolled ? 'bg-background/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-violet-500/30 blur-md group-hover:bg-violet-500/50 transition-all" />
              <div className="relative w-10 h-10 flex items-center justify-center">
                <img src="/iconolinuxmarket.png" alt="Linux Market Logo" className="w-full h-full object-contain drop-shadow-lg" />
              </div>
            </div>
            <div>
              <p className="font-black text-lg tracking-tight text-white leading-none uppercase">LINUX MARKET</p>
              <p className="text-[9px] font-mono tracking-[0.4em] text-violet-400/70 uppercase">Nativo · Seguro · Libre</p>
            </div>
          </div>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-8">
            <a href="#caracteristicas" className="text-xs font-bold uppercase tracking-[0.25em] text-white/50 hover:text-violet-400 transition-colors">Características</a>
            <a href="#descargas" className="text-xs font-bold uppercase tracking-[0.25em] text-white/50 hover:text-violet-400 transition-colors">Descargas</a>
            <a href="#servicios" className="text-xs font-bold uppercase tracking-[0.25em] text-white/50 hover:text-violet-400 transition-colors">Servicios</a>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
              <span className="text-[10px] font-mono text-violet-300 tracking-widest">100% ONLINE</span>
            </div>

            {/* Download Button (Desktop) */}
            <div className="hidden lg:flex items-center gap-3">
              <Link href="/store/login">
                <Button variant="ghost" className="text-xs font-black px-6 py-3 text-violet-400 hover:text-white hover:bg-violet-500/10 transition-all uppercase">
                  VER PROYECTO
                </Button>
              </Link>
              <a href="#descargas">
                <Button className="btn-pill bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-xs font-black px-6 py-3 shadow-lg shadow-violet-500/30 border border-violet-400/30 transition-all hover:scale-105">
                  DESCARGAR
                </Button>
              </a>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-14 h-14 flex items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20 transition-all hover:bg-violet-500/30 active:scale-95 group relative overflow-hidden active:shadow-[0_0_25px_rgba(59,130,246,0.5),0_0_10px_rgba(255,255,255,0.8)]"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-white animate-in fade-in zoom-in duration-300" />
              ) : (
                <div className="relative w-10 h-10 animate-in fade-in zoom-in duration-500">
                  <img
                    src="/ubuntu.png"
                    alt="Ubuntu Menu"
                    className="w-full h-full object-contain animate-spin drop-shadow-[0_0_12px_rgba(59,130,246,0.3)] group-hover:drop-shadow-[0_0_20px_rgba(59,130,246,0.6)] group-active:drop-shadow-[0_0_25px_rgba(255,255,255,0.9)]"
                    style={{ animationDuration: '5s' }}
                  />
                </div>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-background/90 backdrop-blur-md transition-all duration-500 lg:hidden ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Menu Drawer */}
      <div className={`fixed top-0 right-0 bottom-0 w-[80vw] max-w-sm z-[70] bg-background border-l border-white/5 shadow-2xl transition-all duration-500 lg:hidden p-8 flex flex-col ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <img src="/iconolinuxmarket.png" alt="Logo" className="w-10 h-10 object-contain" />
            <span className="font-black text-lg tracking-tight">MENU</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex flex-col gap-4">
          <a
            href="#caracteristicas"
            onClick={() => setMobileMenuOpen(false)}
            className="group flex items-center gap-5 p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/20 transition-all duration-500"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Terminal className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-sm font-black tracking-[0.3em] text-white/60 group-hover:text-white transition-colors uppercase">
              Características
            </span>
          </a>

          <a
            href="#descargas"
            onClick={() => setMobileMenuOpen(false)}
            className="group flex items-center gap-5 p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-violet-600/10 hover:border-violet-500/20 transition-all duration-500"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Download className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-sm font-black tracking-[0.3em] text-white/60 group-hover:text-white transition-colors uppercase">
              Descargas
            </span>
          </a>

          <a
            href="#servicios"
            onClick={() => setMobileMenuOpen(false)}
            className="group flex items-center gap-5 p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-emerald-600/10 hover:border-emerald-500/20 transition-all duration-500"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Blocks className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm font-black tracking-[0.3em] text-white/60 group-hover:text-white transition-colors uppercase">
              Servicios
            </span>
          </a>

          <a
            href="https://wa.me/527721142083?text=Hola,%20me%20interesa%20una%20cotizaci%C3%B3n%20para%20un%20proyecto."
            target="_blank"
            className="flex items-center justify-center gap-3 w-full py-4 rounded-3xl bg-green-500/10 border border-green-500/20 text-green-400 font-bold tracking-widest text-[10px]"
          >
            <MessageCircle className="w-4 h-4" />
            COTIZAR POR WHATSAPP
          </a>
        </nav>

        <div className="mt-auto">
          <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
            <p className="text-[10px] font-black tracking-widest text-white/30 uppercase mb-2">Build Info</p>
            <p className="text-xs font-mono text-violet-400/60">v1.2.0 STABLE - LINUX MARKET</p>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6 w-full z-10 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-10">
              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-5 py-2 text-violet-300 text-[10px] font-black tracking-[0.4em] uppercase">
                  <Server className="w-3 h-3" />
                  Sistema POS Nativo
                </div>
              </div>

              <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.85]">
                <span className="text-white block mb-2">Tu Negocio,</span>
                <span className="gradient-text">Tu Control.</span>
              </h1>

              <p className="text-xl md:text-2xl text-white/50 font-medium leading-relaxed">
                Software POS nativo para Linux con cifrado de grado militar, sincronización en tiempo real y gestión multi-sucursal.
                <span className="text-violet-400 font-bold ml-2 text-balance">Despliegue Profesional.</span>
              </p>

              <div className="flex flex-wrap gap-4 pt-2 relative z-20">
                <a href="#descargas">
                  <Button className="btn-pill bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-black text-base h-15 px-10 shadow-2xl shadow-violet-500/40 border border-violet-400/30 cyber-glow uppercase tracking-widest transition-all hover:scale-105 active:scale-95">
                    DESPLIEGUE GRATUITO
                  </Button>
                </a>
                <Link href="/store/login">
                  <Button variant="outline" className="btn-pill border-violet-500/30 bg-violet-500/5 text-violet-300 font-black text-base h-15 px-10 hover:bg-violet-500/10 hover:border-violet-500/50 uppercase tracking-widest transition-all hover:scale-105 active:scale-95 backdrop-blur-sm">
                    VER PROYECTO
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-8 pt-4 border-t border-white/5">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.5em] text-red-500/80">Cifrado</p>
                  <p className="text-base font-black font-mono text-blue-400">AES-256</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.5em] text-red-500/80">Motor</p>
                  <p className="text-base font-black font-mono text-blue-400">Rust / Tauri</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.5em] text-red-500/80">BD</p>
                  <p className="text-base font-black font-mono text-blue-400">SQLite Local</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.5em] text-red-500/80">Sync</p>
                  <p className="text-base font-black font-mono text-blue-400">SSE Real-time</p>
                </div>
              </div>
            </div>

            <div className="flex order-first lg:order-last justify-center items-center mb-12 lg:mb-0">
              <div className="w-full max-w-xs sm:max-w-sm lg:max-w-2xl pointer-events-none">
                <div className="relative flex items-center justify-center select-none w-full h-[550px] group">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Ultra Intense Hero Glow */}
                    <div className="w-[700px] h-[700px] rounded-full bg-violet-600/25 blur-[160px] animate-pulse-slow"></div>
                    <div className="absolute w-[400px] h-[400px] rounded-full bg-indigo-500/20 blur-[100px] animate-pulse"></div>
                  </div>
                  <div className="relative z-10 transition-all duration-1000 hover:scale-[1.08] drop-shadow-[0_0_120px_rgba(139,92,246,0.4)]">
                    <img
                      src="/mascots/fondoopensuse_transparent.png"
                      alt="Linux Mascots Family"
                      className="w-full max-w-2xl h-auto object-contain animate-float"
                    />
                  </div>
                  <div className="absolute top-16 left-0 glass-card rounded-2xl px-5 py-2 text-[10px] font-black tracking-widest text-blue-300 uppercase border border-blue-500/20 animate-bounce-soft z-20">
                    🔒 AES-256 SECURITY
                  </div>
                  <div className="absolute bottom-24 right-0 glass-card rounded-2xl px-5 py-2 text-[10px] font-black tracking-widest text-emerald-300 uppercase border border-emerald-500/20 animate-bounce-soft z-20" style={{ animationDelay: '0.6s' }}>
                    🐧 NATIVO LINUX
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Linux Distros Film Track */}
      <div className="w-full overflow-hidden py-8 relative bg-white/[0.02] backdrop-blur-sm">
        {/* Subtle top/bottom gradient lines instead of hard borders */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />
        <div className="film-track gap-10">
          {[...distros, ...distros].map((distro, i) => (
            <span key={i} className="flex items-center gap-3 px-6 py-2 rounded-full text-xs font-bold tracking-widest whitespace-nowrap uppercase text-blue-300/60">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
              {distro.name} {distro.dist}
            </span>
          ))}
        </div>
      </div>

      {/* Features Grid - Section 2 */}
      <section id="caracteristicas" className="py-32 relative z-10">
        {/* Intense Corner Lights (2 per corner) */}
        {/* Top-Left */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />

        {/* Top-Right */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-fuchsia-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-violet-600/15 blur-[100px] rounded-full pointer-events-none" />

        {/* Bottom-Left */}
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-fuchsia-600/10 blur-[100px] rounded-full pointer-events-none" />

        {/* Bottom-Right */}
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-600/15 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20 space-y-5">
            <span className="inline-block text-[10px] font-black tracking-[0.5em] text-violet-400 uppercase border border-violet-500/20 rounded-full px-4 py-1.5 bg-violet-500/5">
              Arquitectura Técnica
            </span>
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.8] mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-300 to-cyan-500 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              Ingeniería<br />
              Sin Límites.
            </h2>
            <p className="text-xl text-white/40 font-medium max-w-2xl">
              Cada módulo diseñado para entorno de misión crítica donde la falla no es una opción.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.slice(0, 4).map((f, i) => (
              <div
                key={i}
                className={`glass-card scan-effect rounded-[32px] p-8 group cursor-default border border-white/5 relative overflow-hidden shadow-2xl transition-all duration-500 hover:-translate-y-2`}
              >
                {/* Background Color Aura (Persistent) */}
                <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 group-hover:opacity-30 transition-opacity ${f.color.replace('text-', 'bg-')}`} />

                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-all shadow-2xl overflow-hidden relative`}>
                    <div className={`absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity ${f.color.replace('text-', 'bg-')}`} />
                    <f.icon className={`w-7 h-7 relative z-10 ${f.color} drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]`} />
                  </div>
                  <span className={`text-[9px] font-black tracking-widest uppercase rounded-full px-3 py-1 ${f.color.replace('text-', 'bg-')} text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] drop-shadow-[0_0_4px_rgba(59,130,246,0.8)]`}>
                    {f.badge}
                  </span>
                </div>

                <div className="relative z-10">
                  <h3 className="text-xl font-black text-white mb-3 tracking-tight group-hover:translate-x-1 transition-transform">{f.title}</h3>
                  <p className="text-xs text-white/50 leading-relaxed font-semibold group-hover:text-white transition-colors">
                    {f.desc}
                  </p>
                </div>

                {/* Constant underlying line light */}
                <div className={`absolute bottom-0 left-0 h-1 rounded-full opacity-30 group-hover:opacity-100 transition-all duration-700 blur-[1px] ${f.color.replace('text-', 'bg-')}`} style={{ width: '40%' }} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {features.slice(4, 8).map((f, i) => (
              <div
                key={i}
                className={`glass-card scan-effect rounded-[32px] p-8 group cursor-default border border-white/5 relative overflow-hidden shadow-2xl transition-all duration-500 hover:-translate-y-2`}
              >
                {/* Background Color Aura (Persistent) */}
                <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 group-hover:opacity-30 transition-opacity ${f.color.replace('text-', 'bg-')}`} />

                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-all shadow-2xl overflow-hidden relative`}>
                    <div className={`absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity ${f.color.replace('text-', 'bg-')}`} />
                    <f.icon className={`w-7 h-7 relative z-10 ${f.color} drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]`} />
                  </div>
                  <span className={`text-[9px] font-black tracking-widest uppercase rounded-full px-3 py-1 ${f.color.replace('text-', 'bg-')} text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] drop-shadow-[0_0_4px_rgba(59,130,246,0.8)]`}>
                    {f.badge}
                  </span>
                </div>

                <div className="relative z-10">
                  <h3 className="text-xl font-black text-white mb-3 tracking-tight group-hover:translate-x-1 transition-transform">{f.title}</h3>
                  <p className="text-xs text-white/50 leading-relaxed font-semibold group-hover:text-white transition-colors">
                    {f.desc}
                  </p>
                </div>

                {/* Constant underlying line light */}
                <div className={`absolute bottom-0 left-0 h-1 rounded-full opacity-30 group-hover:opacity-100 transition-all duration-700 blur-[1px] ${f.color.replace('text-', 'bg-')}`} style={{ width: '40%' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Terminal Command Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="glass-card rounded-[40px] p-1 border border-white/5 bg-white/5 relative overflow-hidden group shadow-2xl">
            {/* Top Glow bar */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            
            <div className="bg-black/60 backdrop-blur-3xl rounded-[38px] p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="space-y-6 flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-cyan-400 text-[10px] font-black tracking-widest uppercase">
                    <Terminal className="w-3 h-3" />
                    DESPLIEGUE INSTANTÁNEO
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                    Instala con <span className="text-cyan-400">un solo comando.</span>
                  </h2>
                  <p className="text-white/40 text-sm font-medium leading-relaxed max-w-md">
                    Copia y pega en tu terminal para descargar, configurar e iniciar el servidor POS de forma 100% automatizada.
                  </p>
                </div>

                <div className="w-full max-w-md relative group/terminal">
                  <div className="absolute -inset-1 bg-cyan-500/20 blur-xl rounded-2xl opacity-0 group-hover/terminal:opacity-100 transition-opacity" />
                  <div className="relative bg-[#0d1117] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                    <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5 bg-white/5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                      <span className="ml-2 text-[9px] font-mono text-white/30 uppercase tracking-widest">bash</span>
                    </div>
                    <div className="p-6 font-mono text-sm">
                      <div className="flex items-start gap-3">
                        <span className="text-cyan-500 mt-1">$</span>
                        <code className="text-blue-300 break-all leading-relaxed whitespace-pre-wrap">
                          curl -sSL https://raw.githubusercontent.com/Alexglv2000/linux-market/main/pos-local/installer/install.sh | sudo bash
                        </code>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText('curl -sSL https://raw.githubusercontent.com/Alexglv2000/linux-market/main/pos-local/installer/install.sh | sudo bash');
                        // Toast success could go here
                      }}
                      className="absolute top-14 right-4 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-cyan-500/20 transition-all group/copy"
                    >
                      <Activity className="w-4 h-4 text-white/40 group-hover/copy:text-cyan-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Downloads Section */}
      <section id="descargas" className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <div className="space-y-5">
                <span className="inline-block text-[10px] font-black tracking-[0.5em] text-violet-400 uppercase border border-violet-500/20 rounded-full px-4 py-1.5 bg-violet-500/5">
                  Multi-Distro
                </span>
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                  Instala en<br />
                  <span className="gradient-text">Segundos.</span>
                </h2>
                <p className="text-xl text-white/40 max-w-md">
                  Binarios nativos para cada arquitectura. Elige tu distribución y despliega en segundos.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                <div className="relative group">
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-8 bg-red-600/10 blur-[40px] rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                  <Link
                    href="https://github.com/Alexglv2000/linux-market/releases/latest/download/linux-market.deb"
                    className="flex items-center justify-between glass-card rounded-3xl p-5 border border-white/5 group hover:border-red-500/40 hover:shadow-[0_15px_35px_rgba(239,68,68,0.15)] transition-all duration-500 relative z-10 overflow-hidden"
                    download
                  >
                    <div className="flex items-center gap-6">
                      <div className="relative w-14 h-14 flex-shrink-0">
                        <div className="absolute inset-0 bg-red-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative w-full h-full rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-500 backdrop-blur-2xl">
                          <div className="w-8 h-8">
                            <DebianLogo />
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-black text-2xl tracking-tight text-white group-hover:text-red-400 transition-colors">Debian / Ubuntu</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="px-3 py-0.5 rounded-full border border-red-500/20 bg-red-500/5 text-red-400 font-black tracking-widest text-[9px]">.DEB ARCHIVE</span>
                          <span className="text-[9px] font-black tracking-[0.2em] text-red-500/60 uppercase">Nativo APT</span>
                        </div>
                      </div>
                    </div>
                    <Button className="btn-pill h-12 px-8 text-[11px] font-black tracking-[0.2em] bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-500/40 transition-all uppercase sm:flex hidden">
                      DESCARGAR
                    </Button>
                  </Link>
                </div>

                {/* Fedora Button */}
                <div className="relative group">
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-8 bg-violet-600/20 blur-[40px] rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                  <Link
                    href="https://github.com/Alexglv2000/linux-market/releases/latest/download/linux-market.rpm"
                    className="flex items-center justify-between glass-card rounded-3xl p-5 border border-white/5 group hover:border-violet-500/40 hover:shadow-[0_15px_35px_rgba(139,92,246,0.15)] transition-all duration-500 relative z-10 overflow-hidden"
                    download
                  >
                    <div className="flex items-center gap-6">
                      <div className="relative w-14 h-14 flex-shrink-0">
                        <div className="absolute inset-0 bg-violet-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative w-full h-full rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-500 backdrop-blur-2xl">
                          <div className="w-8 h-8">
                            <FedoraLogo />
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-black text-2xl tracking-tight text-white group-hover:text-violet-400 transition-colors">Fedora / RHEL</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="px-3 py-0.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-400 font-black tracking-widest text-[9px]">.RPM ARCHIVE</span>
                          <span className="text-[9px] font-black tracking-[0.2em] text-violet-500/60 uppercase">Nativo DNF</span>
                        </div>
                      </div>
                    </div>
                    <Button className="btn-pill h-12 px-8 text-[11px] font-black tracking-[0.2em] bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/40 transition-all uppercase sm:flex hidden">
                      DESCARGAR
                    </Button>
                  </Link>
                </div>

                {/* Arch Button */}
                <div className="relative group">
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-8 bg-violet-600/20 blur-[40px] rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                  <Link
                    href="https://github.com/Alexglv2000/linux-market/releases/latest/download/linux-market.tar.gz"
                    className="flex items-center justify-between glass-card rounded-3xl p-5 border border-white/5 group hover:border-violet-500/40 hover:shadow-[0_15px_35px_rgba(139,92,246,0.15)] transition-all duration-500 relative z-10 overflow-hidden"
                    download
                  >
                    <div className="flex items-center gap-6">
                      <div className="relative w-14 h-14 flex-shrink-0">
                        <div className="absolute inset-0 bg-violet-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative w-full h-full rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-500 backdrop-blur-2xl">
                          <div className="w-8 h-8">
                            <ArchLogo />
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-black text-2xl tracking-tight text-white group-hover:text-violet-400 transition-colors">Arch / Genérico</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="px-3 py-0.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-400 font-black tracking-widest text-[9px]">.TAR.GZ BUNDLE</span>
                          <span className="text-[9px] font-black tracking-[0.2em] text-violet-500/60 uppercase">Nativo PACMAN</span>
                        </div>
                      </div>
                    </div>
                    <Button className="btn-pill h-12 px-8 text-[11px] font-black tracking-[0.2em] bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-500/40 transition-all uppercase sm:flex hidden">
                      DESCARGAR
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="relative w-72 h-72 md:w-96 md:h-96">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 to-indigo-600/20 rounded-full blur-3xl" />
                <div className="relative w-full h-full glass-card rounded-full flex items-center justify-center border border-violet-500/20 shadow-2xl">
                  <img
                    src="/iconolinuxmarket.png"
                    alt="Linux Market central logo"
                    className="w-3/5 h-3/5 object-contain drop-shadow-2xl animate-float"
                  />
                  <div className="absolute inset-4 rounded-full border border-blue-500/10 animate-spin" style={{ animationDuration: '20s' }} />
                  <div className="absolute inset-10 rounded-full border border-blue-500/8 animate-spin" style={{ animationDuration: '30s', animationDirection: 'reverse' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 space-y-5">
            <span className="inline-block text-[10px] font-black tracking-[0.5em] text-violet-400 uppercase border border-violet-500/20 rounded-full px-4 py-1.5 bg-violet-500/5">
              Desarrollo a Medida
            </span>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
              Haz Crecer<br />
              <span className="gradient-text">Tu Visión.</span>
            </h2>
            <p className="text-xl text-white/40 font-medium max-w-2xl mx-auto">
              Linux-Market POS es <span className="text-blue-300 font-bold">gratuito</span>. Si necesitas algo a medida — web, app, sistema — lo construimos por ti.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-card rounded-3xl p-10 flex flex-col group hover:border-blue-400/40 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600/30 to-indigo-600/20 border border-blue-500/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Globe className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Desarrollo Web Élite</h3>
              <p className="text-white/40 font-medium leading-relaxed mb-8 flex-1">
                Páginas increíbles construidas con Next.js, optimizadas para posicionamiento y conversión.
              </p>
              <ul className="space-y-3 mb-10">
                <li className="flex items-center gap-3 text-xs font-black tracking-widest text-blue-400 uppercase">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Performance 100/100
                </li>
                <li className="flex items-center gap-3 text-xs font-black tracking-widest text-blue-400 uppercase">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Diseño a medida
                </li>
              </ul>
              <a
                href="https://wa.me/527721142083?text=Hola,%20me%20interesa%20una%20cotizaci%C3%B3n%20para%20Desarrollo%20Web%20%C3%89lite."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-2xl shadow-xl shadow-blue-500/30 transition-all uppercase tracking-widest text-xs border-none">
                  CONSULTAR →
                </Button>
              </a>
            </div>

            <div className="glass-card rounded-3xl p-10 flex flex-col group hover:border-violet-400/40 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/30 to-purple-600/20 border border-violet-500/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Blocks className="w-7 h-7 text-violet-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Software Nativo</h3>
              <p className="text-white/40 font-medium leading-relaxed mb-8 flex-1">
                Aplicaciones de escritorio robustas en Rust y Tauri. Binarios nativos, cero dependencias.
              </p>
              <ul className="space-y-3 mb-10">
                <li className="flex items-center gap-3 text-xs font-black tracking-widest text-violet-400 uppercase">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500" /> Sin Cloud forzada
                </li>
                <li className="flex items-center gap-3 text-xs font-black tracking-widest text-violet-400 uppercase">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500" /> Seguridad Total
                </li>
              </ul>
              <a
                href="https://wa.me/527721142083?text=Hola,%20me%20interesa%20una%20cotizaci%C3%B3n%20para%20Software%20Nativo%20(Rust/Tauri)."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-6 rounded-2xl shadow-xl shadow-violet-500/30 transition-all uppercase tracking-widest text-xs border-none">
                  CONSULTAR →
                </Button>
              </a>
            </div>

            <div className="glass-card rounded-3xl p-10 flex flex-col group hover:border-orange-500/40 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-600/30 to-red-600/20 border border-orange-500/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Activity className="w-7 h-7 text-orange-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Sistemas a Medida</h3>
              <p className="text-white/40 font-medium leading-relaxed mb-8 flex-1">
                Tu idea hecha software. Desde sistemas de gestión hasta plataformas propietarias.
              </p>
              <ul className="space-y-3 mb-10">
                <li className="flex items-center gap-3 text-xs font-black tracking-widest text-orange-500 uppercase">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Propiedad 100% tuya
                </li>
                <li className="flex items-center gap-3 text-xs font-black tracking-widest text-orange-500 uppercase">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Soporte dedicado
                </li>
              </ul>
              <a
                href="https://wa.me/527721142083?text=Hola,%20me%20interesa%20una%20cotizaci%C3%B3n%20para%20un%20Sistema%20a%20Medida."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-6 rounded-2xl shadow-xl shadow-orange-500/30 transition-all uppercase tracking-widest text-xs border-none">
                  CONSULTAR →
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 relative z-10">
        {/* Superior Glow Divider */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent shadow-[0_0_20px_rgba(255,255,255,0.02)]" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-16 mb-16">
            <div className="space-y-5 max-w-xs">
              <div className="flex items-center gap-3">
                <img src="/iconolinuxmarket.png" className="w-10 h-10 object-contain drop-shadow-lg" alt="Logo" />
                <span className="font-black text-xl tracking-tight">LINUX MARKET</span>
              </div>
              <p className="text-white/30 text-sm leading-relaxed font-medium">
                POS nativo para Linux. Construido con Rust, Tauri y SQLite. Libre para usar, profesional para escalar.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-16">
              <div className="space-y-5">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400">Sistema</p>
                <ul className="space-y-3 text-sm text-white/30 font-medium">
                  <li className="hover:text-blue-300 transition-colors cursor-pointer">POS Sucursal</li>
                  <li className="hover:text-blue-300 transition-colors cursor-pointer">Panel Central</li>
                </ul>
              </div>
              <div className="space-y-5">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400">Tech Stack</p>
                <ul className="space-y-3 text-sm text-white/30 font-mono">
                  <li>Rust 🦀</li>
                  <li>Tauri v2</li>
                  <li>Next.js 15</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col lg:flex-row justify-between items-center gap-6">
            <p className="text-[10px] text-white/20 font-black tracking-[0.4em] uppercase">
              © 2026 Linux-Market · Alexis Gabriel Lugo Villeda
            </p>
            <div className="flex gap-8">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                <span className="text-[9px] font-black tracking-widest text-white/20 uppercase">Sistema Activo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-[9px] font-black tracking-widest text-white/20 uppercase">v1.2.0 Stable</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <AIAdvisor />
    </div>
  )
}
