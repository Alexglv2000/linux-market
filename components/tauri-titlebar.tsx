'use client'

import { useEffect, useState } from 'react'
import { Minus, X, Maximize2, Minimize2 } from 'lucide-react'

export function TauriTitlebar() {
  const [isTauri, setIsTauri] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    // Solo se activa cuando corre dentro de Tauri
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      setIsTauri(true)
      document.body.classList.add('tauri-app')
    }
  }, [])

  if (!isTauri) return null

  const handleClose = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const win = getCurrentWindow()
      await win.close()
    } catch (e) { 
      console.error('Tauri Close Error:', e) 
    }
  }

  const handleMinimize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const win = getCurrentWindow()
      await win.minimize()
    } catch (e) { 
      console.error('Tauri Minimize Error:', e) 
    }
  }

  const handleMaximize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const win = getCurrentWindow()
      const maximized = await win.isMaximized()
      if (maximized) {
        await win.unmaximize()
        setIsMaximized(false)
      } else {
        await win.maximize()
        setIsMaximized(true)
      }
    } catch (e) { 
      console.error('Tauri Maximize Error:', e) 
    }
  }

  return (
    <div
      data-tauri-drag-region
      className="fixed top-0 left-0 right-0 z-[9999] h-10 flex items-center justify-between bg-background/95 backdrop-blur-md border-b border-white/5 select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Izquierda: ícono + nombre */}
      <div className="flex items-center gap-2.5 px-4 h-full pointer-events-none">
        <img
          src="/iconolinuxmarket.png"
          alt="L-M"
          className="w-5 h-5 object-contain"
          draggable={false}
        />
        <span className="text-[10px] font-black text-foreground/70 uppercase tracking-[0.2em] mt-0.5">
          Linux-Market POS v1.2
        </span>
      </div>

      {/* Derecha: controles de ventana */}
      <div
        className="flex items-center h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="h-10 w-11 flex items-center justify-center hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground group"
          title="Minimizar"
        >
          <Minus className="w-3.5 h-3.5 group-active:scale-90 transition-transform" />
        </button>
        <button
          onClick={handleMaximize}
          className="h-10 w-11 flex items-center justify-center hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground group"
          title={isMaximized ? 'Restaurar' : 'Maximizar'}
        >
          {isMaximized
            ? <Minimize2 className="w-3.5 h-3.5 group-active:scale-90 transition-transform" />
            : <Maximize2 className="w-3.5 h-3.5 group-active:scale-90 transition-transform" />
          }
        </button>
        <button
          onClick={handleClose}
          className="h-10 w-12 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors text-muted-foreground group"
          title="Cerrar"
        >
          <X className="w-3.5 h-3.5 group-active:scale-90 transition-transform" />
        </button>
      </div>
    </div>
  )
}
