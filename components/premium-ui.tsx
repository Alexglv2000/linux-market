'use client'

import { useEffect, useState } from 'react'

/**
 * PremiumUI — Reusable decorative atmosphere components.
 * Extracted from Landing Page for global consistency.
 */

// ─── Custom Premium Cursor ───
export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isPointer, setIsPointer] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleMouseMove = (e: MouseEvent) => {
      try {
        setPosition({ x: e.clientX, y: e.clientY })
        const target = e.target as HTMLElement
        // Safety guard: document or window are not valid elements for getComputedStyle
        if (typeof window !== 'undefined' && target && target instanceof Element) {
          setIsPointer(window.getComputedStyle(target).cursor === 'pointer')
        }
        if (!isVisible) setIsVisible(true)
      } catch (err) {
        // Silent fail to prevent application crash on decoration error
        console.warn('[CustomCursor] Decoration error:', err)
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isVisible])

  if (!mounted) return null

  if (typeof window !== 'undefined' && ('ontouchstart' in window)) return null

  return (
    <div 
      className={`fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[1000] transition-transform duration-300 ease-out border border-primary/50 mix-blend-screen ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ 
        transform: `translate(${position.x - 16}px, ${position.y - 16}px) scale(${isPointer ? 1.5 : 1})`,
        background: isPointer ? 'var(--primary-glow)' : 'transparent'
      }}
    >
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-md animate-pulse" />
      <div className="absolute inset-[40%] rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
    </div>
  )
}

// ─── Atmospheric Floating Orbs (Ultra-Premium Lighting) ───
export function FloatingOrbs({ color = 'violet' }: { color?: 'violet' | 'red' | 'blue' | 'green' }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const variants = {
    violet: 'bg-violet-600/20',
    red: 'bg-red-600/20',
    blue: 'bg-blue-600/20',
    green: 'bg-green-600/20'
  }
  const orbColor = variants[color] || variants.violet

  if (!mounted) return null

  return (
    <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden">
      {/* Dynamic Atmosfearic Layers */}
      <div className="absolute inset-0 bg-gradient-to-tr from-violet-900/5 via-transparent to-indigo-900/5" />
      
      {/* Top Left Bloom */}
      <div className={`absolute w-[800px] h-[800px] -top-[300px] -left-[200px] ${orbColor} blur-[180px] rounded-full animate-pulse-slow opacity-60`} />
      
      {/* Top Right Aura */}
      <div className="absolute w-[600px] h-[600px] -top-[100px] -right-[150px] bg-indigo-500/20 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Center Background Light */}
      <div className="absolute w-[1000px] h-[1000px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-900/5 blur-[200px] rounded-full" />
      
      {/* Bottom Center Glow */}
      <div className="absolute w-[900px] h-[900px] -bottom-[400px] left-1/3 bg-fuchsia-600/15 blur-[180px] rounded-full animate-pulse-slow" style={{ animationDelay: '4s' }} />
      
      {/* Mid Left Accent */}
      <div className="absolute w-[400px] h-[400px] top-1/2 -left-[100px] bg-violet-400/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Right Neon Beam */}
      <div className="absolute w-[500px] h-[500px] top-[40%] -right-[100px] bg-indigo-600/20 blur-[160px] rounded-full animate-pulse" style={{ animationDelay: '3s' }} />
      
      {/* Cyan Cyber Accent */}
      <div className="absolute w-[300px] h-[300px] bottom-[20%] left-[5%] bg-cyan-500/10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '5s' }} />
    </div>
  )
}

// ─── Scan Effect Overlay (for specific sections) ───
export function Scanline() {
  return <div className="absolute inset-0 scan-effect pointer-events-none z-10" />
}
