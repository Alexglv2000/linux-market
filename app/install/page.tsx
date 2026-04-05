'use client'

import { Button } from '@/components/ui/button'
import { 
  Download, 
  ArrowLeft,
  Monitor,
  Terminal,
  Cpu
} from 'lucide-react'
import Link from 'next/link'
import { FloatingOrbs } from '@/components/premium-ui'

export default function InstallRequiredPage() {
  return (
    <div className="min-h-screen text-foreground overflow-hidden relative bg-[#020205] flex items-center justify-center p-6">
      
      {/* Background Atmosphere */}
      <FloatingOrbs color="violet" />
      
      <div className="fixed inset-0 pointer-events-none -z-5">
         <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-violet-600/10 blur-[200px] animate-pulse-slow" />
         <div className="absolute bottom-1/4 right-1/4 w-[1000px] h-[1000px] bg-indigo-600/10 blur-[250px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Container */}
      <div className="max-w-4xl w-full z-10">
        <div className="glass-card rounded-[40px] p-12 border border-white/5 relative overflow-hidden shadow-2xl backdrop-blur-2xl">
          
          {/* Internal Glows */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 blur-[100px] -z-10" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/20 blur-[100px] -z-10" />
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">

              
              <h1 className="text-5xl font-black tracking-tighter leading-none text-white">
                Requiere<br />
                <span className="gradient-text">Instalación Local.</span>
              </h1>
              
              <p className="text-lg text-white/50 font-medium leading-relaxed">
                Linux-Market POS es un software nativo de alto rendimiento que se ejecuta directamente en su hardware para garantizar seguridad total y baja latencia.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-all">
                    <Monitor className="w-5 h-5 text-violet-400" />
                  </div>
                  <p className="text-sm font-bold text-white/70">Binario Nativo Linux (x86_64 / ARM)</p>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-all">
                    <Cpu className="w-5 h-5 text-indigo-400" />
                  </div>
                  <p className="text-sm font-bold text-white/70">Optimizado para Kernel 5.x+</p>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                <Link href="/#descargas">
                  <Button className="btn-pill bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-sm h-14 px-10 shadow-2xl shadow-violet-500/40 cyber-glow uppercase tracking-widest">
                    <Download className="w-4 h-4 mr-2" />
                    IR A DESCARGAS
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="btn-pill h-14 px-8 text-white font-black text-sm border-white/10 bg-white/5 hover:bg-white/10 transition-all uppercase tracking-widest">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    VOLVER
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="relative w-full aspect-square max-w-[300px]">
                <div className="absolute inset-0 bg-violet-600/20 blur-[80px] rounded-full animate-pulse" />
                <div className="relative w-full h-full glass-card rounded-[32px] border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden group">
                   <div className="absolute inset-0 scan-effect opacity-30" />
                   <div className="relative z-10 flex flex-col items-center gap-6">
                      <div className="relative">
                        <div className="absolute -inset-4 bg-violet-500/20 blur-xl rounded-full" />
                        <img 
                          src="/iconolinuxmarket.png" 
                          alt="Linux Market Logo" 
                          className="w-24 h-24 object-contain drop-shadow-[0_0_20px_rgba(139,92,246,0.5)] animate-float"
                        />
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-center mt-12 text-[10px] font-black uppercase tracking-[0.5em] text-white/20">
          © 2026 Linux-Market · Arquitectura de Misión Crítica
        </p>
      </div>
    </div>
  )
}
