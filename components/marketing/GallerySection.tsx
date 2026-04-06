/**
 * components/marketing/GallerySection.tsx
 * Author: Alexis Gabriel Lugo Villeda
 *
 * "Vistazo al Sistema" gallery section with full-screen Lightbox.
 * Extracted from the monolithic page.tsx.
 * UI is 100% identical to the original implementation.
 */

'use client'

import { useState } from 'react'
import {
  ShieldCheck, ShoppingCart, Package,
  ArrowRight, ClipboardList, LayoutDashboard,
  X, ChevronLeft, ChevronRight
} from 'lucide-react'

// Gallery image data — centralized for easy extension
const GALLERY_IMAGES = [
  { src: '/screenshots/dashboard.png', title: 'Dashboard Principal',  desc: 'Panel de estadísticas',  icon: LayoutDashboard },
  { src: '/screenshots/pos.png',       title: 'Punto de Venta',       desc: 'Interfaz de cajero',      icon: ShoppingCart    },
  { src: '/screenshots/inventory.png', title: 'Inventario',           desc: 'Control de productos',    icon: Package         },
  { src: '/screenshots/superadmin.png',title: 'Super Admin',          desc: 'Gestión global',          icon: ShieldCheck     },
  { src: '/screenshots/transfers.png', title: 'Transferencias',       desc: 'Logística interna',       icon: ArrowRight      },
  { src: '/screenshots/audit.png',     title: 'Auditoría',            desc: 'Registro de seguridad',   icon: ClipboardList   },
]

export function GallerySection() {
  // Lightbox state: null = closed, number = active image index
  const [selectedImg, setSelectedImg] = useState<number | null>(null)

  return (
    <>
      {/* Gallery Grid Section */}
      <section id="galeria" className="py-24 relative z-10 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-4 mb-16">
          <span className="inline-block text-[10px] font-black tracking-[0.5em] text-cyan-400 uppercase border border-cyan-500/20 rounded-full px-4 py-1.5 bg-cyan-500/5">
            Digno de Todo Público
          </span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
            Vistazo al <span className="gradient-text">Sistema Real.</span>
          </h2>
          <p className="text-white/40 text-sm max-w-xl mx-auto font-medium">
            Capturas reales del funcionamiento nativo del software en diferentes entornos de Linux.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GALLERY_IMAGES.map((img, i) => (
              <div
                key={i}
                onClick={() => setSelectedImg(i)}
                className="group relative rounded-3xl overflow-hidden bg-black/40 border border-white/5 shadow-2xl transition-all duration-700 hover:-translate-y-2 hover:shadow-cyan-500/10 cursor-pointer"
              >
                <img
                  src={img.src}
                  alt={img.title}
                  className="w-full aspect-video object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 opacity-70" />
                <div className="absolute bottom-0 inset-x-0 p-6 z-20">
                  <h3 className="text-lg font-bold text-white mb-1">{img.title}</h3>
                  <p className="text-[10px] text-white/40 font-mono tracking-widest uppercase">{img.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox — full-screen image viewer with arrow navigation */}
      {selectedImg !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">

          {/* Close button */}
          <button
            onClick={() => setSelectedImg(null)}
            className="absolute top-10 right-10 p-4 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all z-[110]"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Previous arrow — cyclical */}
          <button
            onClick={() => setSelectedImg((selectedImg - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length)}
            className="absolute left-6 md:left-12 p-5 rounded-full bg-white/5 border border-white/10 text-white hover:bg-cyan-500/20 hover:border-cyan-500/30 transition-all z-[110] active:scale-95 group"
          >
            <ChevronLeft className="w-10 h-10 group-hover:-translate-x-1 transition-transform" />
          </button>

          {/* Active image */}
          <div className="relative max-w-6xl w-full aspect-video rounded-[40px] overflow-hidden shadow-[0_0_80px_rgba(34,211,238,0.2)] border border-white/10 animate-in zoom-in duration-500">
            <img
              src={GALLERY_IMAGES[selectedImg].src}
              alt={GALLERY_IMAGES[selectedImg].title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 p-12 bg-gradient-to-t from-black via-black/40 to-transparent">
              <h3 className="text-4xl font-black text-white mb-2">{GALLERY_IMAGES[selectedImg].title}</h3>
              <p className="text-cyan-400 font-mono tracking-widest uppercase text-xs">{GALLERY_IMAGES[selectedImg].desc}</p>
            </div>
          </div>

          {/* Next arrow — cyclical */}
          <button
            onClick={() => setSelectedImg((selectedImg + 1) % GALLERY_IMAGES.length)}
            className="absolute right-6 md:right-12 p-5 rounded-full bg-white/5 border border-white/10 text-white hover:bg-cyan-500/20 hover:border-cyan-500/30 transition-all z-[110] active:scale-95 group"
          >
            <ChevronRight className="w-10 h-10 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Progress indicator dots */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
            {GALLERY_IMAGES.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${selectedImg === i ? 'w-12 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'w-3 bg-white/20'}`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
