'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Sparkles } from 'lucide-react'

export function AIAdvisor() {
  const [advisorOpen, setAdvisorOpen] = useState(false)
  const [advisorMessage, setAdvisorMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [tipIndex, setTipIndex] = useState(0)

  const kbTips = [
    "¿Sabías que Linux Market usa cifrado AES-256 de grado militar para proteger tus ventas locales?",
    "Nuestra licencia está atada al silicio vía MAC Address para garantizar seguridad absoluta.",
    "El motor del sistema está escrito en Rust, lo que garantiza un consumo de memoria casi nulo.",
    "El sistema es 'Offline-First': puedes vender sin internet y se sincronizará automáticamente al volver.",
    "Usamos SSE (Server-Sent Events) para una sincronización en tiempo real sin latencia entre sucursales.",
    "SQLite está optimizado con índices avanzados para manejar millones de registros sin despeinarse.",
    "Si necesitas una funcionalidad a medida, mi equipo de desarrollo puede construirla por ti.",
    "Puedes monitorear el estado del servidor en tiempo real desde el panel de diagnóstico en el login.",
    "El sistema soporta periféricos nativos como impresoras térmicas y escáneres vía HID sin drivers extras."
  ]

  const toggleAdvisor = () => {
    if (!advisorOpen) {
      setAdvisorOpen(true)
      setIsTyping(true)
      setTimeout(() => {
        setAdvisorMessage(kbTips[tipIndex])
        setIsTyping(false)
        setTipIndex((prev) => (prev + 1) % kbTips.length)
      }, 1200)
    } else {
      setAdvisorOpen(false)
    }
  }

  return (
    <div className="fixed bottom-6 left-6 z-[100] flex flex-col items-start gap-3 pointer-events-none">
      {/* Chat Bubble / Advisor Dialog */}
      <div className={`transition-all duration-500 transform origin-bottom-left pointer-events-auto ${advisorOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-10'} mb-2`}>
        <div className="glass-card rounded-[2rem] p-6 max-w-[280px] border border-violet-500/30 shadow-[0_20px_50px_rgba(139,92,246,0.3)] relative overflow-hidden backdrop-blur-2xl">
          <div className="absolute top-0 left-0 w-20 h-20 bg-violet-600/10 blur-2xl" />
          <div className="flex items-center gap-3 mb-3 border-b border-white/5 pb-3">
            <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center border border-violet-400/30">
              <img src="/iconolinuxmarket.png" alt="Bot" className="w-5 h-5 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black tracking-[0.2em] text-violet-300 uppercase">AI Advisor</span>
              <span className="text-[8px] font-mono text-violet-400/50">v1.2.0 ACTIVE</span>
            </div>
          </div>
          
          {isTyping ? (
            <div className="flex gap-1.5 py-4 items-center justify-center">
              <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-white/80 leading-relaxed">
                {advisorMessage}
              </p>
              <div className="flex items-center gap-2 text-[9px] font-black text-violet-400/60 uppercase tracking-widest">
                <Sparkles className="w-3 h-3" />
                Consejo Pro
              </div>
            </div>
          )}
          
          <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
            <button 
              onClick={toggleAdvisor}
              className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[9px] font-black tracking-widest text-white/40 hover:text-white transition-all uppercase whitespace-nowrap"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 pointer-events-auto">
        <button 
          onClick={toggleAdvisor}
          className="relative animate-float focus:outline-none group"
        >
          <div className={`absolute -inset-2 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 blur-md opacity-60 transition-all duration-500 ${advisorOpen ? 'scale-125' : 'group-hover:scale-110'}`} />
          <div className={`relative w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl transition-all duration-500 ${advisorOpen ? 'ring-4 ring-violet-400/40' : 'hover:scale-105 shadow-violet-500/30 border border-violet-400/30'}`}>
            <img
              src="/iconolinuxmarket.png"
              alt="Linux Market Bot"
              className="w-10 h-10 object-contain drop-shadow-lg"
            />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-background animate-ping shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-background shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
        </button>
      </div>
    </div>
  )
}
