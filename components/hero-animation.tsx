'use client'

import { useState, useEffect } from 'react'

// Tux SVG mascot — hand-drawn, pure SVG, no external deps
function TuxSVG({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Tux the Linux penguin">
      {/* Shadow */}
      <ellipse cx="50" cy="114" rx="28" ry="5" fill="black" opacity="0.18" />
      {/* Body */}
      <ellipse cx="50" cy="82" rx="30" ry="32" fill="#1a1a2e" />
      {/* White belly */}
      <ellipse cx="50" cy="86" rx="20" ry="24" fill="#f0f0f0" />
      {/* Head */}
      <ellipse cx="50" cy="36" rx="26" ry="26" fill="#1a1a2e" />
      {/* White face patch */}
      <ellipse cx="50" cy="38" rx="17" ry="18" fill="#f0f0f0" />
      {/* Left eye white */}
      <ellipse cx="41" cy="30" rx="6" ry="7" fill="white" />
      {/* Right eye white */}
      <ellipse cx="59" cy="30" rx="6" ry="7" fill="white" />
      {/* Left pupil */}
      <circle cx="42.5" cy="31" r="3.5" fill="#111" />
      {/* Right pupil */}
      <circle cx="60.5" cy="31" r="3.5" fill="#111" />
      {/* Eye shine left */}
      <circle cx="44" cy="29.5" r="1.2" fill="white" />
      {/* Eye shine right */}
      <circle cx="62" cy="29.5" r="1.2" fill="white" />
      {/* Beak */}
      <ellipse cx="50" cy="44" rx="8" ry="5" fill="#f59e0b" />
      <path d="M42 44 Q50 50 58 44" stroke="#d97706" strokeWidth="1" fill="none" />
      {/* Blush left */}
      <ellipse cx="35" cy="38" rx="5" ry="3" fill="#f472b6" opacity="0.35" />
      {/* Blush right */}
      <ellipse cx="65" cy="38" rx="5" ry="3" fill="#f472b6" opacity="0.35" />
      {/* Left wing */}
      <ellipse cx="16" cy="76" rx="9" ry="20" fill="#1a1a2e" transform="rotate(-15 16 76)" />
      {/* Right wing */}
      <ellipse cx="84" cy="76" rx="9" ry="20" fill="#1a1a2e" transform="rotate(15 84 76)" />
      {/* Left foot */}
      <ellipse cx="36" cy="111" rx="14" ry="5" fill="#f59e0b" />
      <path d="M26 111 L22 116 M33 112 L31 117 M40 112 L38 117" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      {/* Right foot */}
      <ellipse cx="64" cy="111" rx="14" ry="5" fill="#f59e0b" />
      <path d="M54 112 L52 117 M61 112 L61 117 M68 112 L70 117" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// Distro badge that orbits Tux
function DistroBadge({ label, angle, radius, color, delay }: {
  label: string; angle: number; radius: number; color: string; delay: number
}) {
  return (
    <div
      className="absolute flex items-center justify-center animate-spin-slow"
      style={{ width: radius * 2, height: radius * 2, animationDelay: `${delay}s` }}
    >
      <div
        className={`absolute px-2 py-1 rounded-full text-[9px] font-bold tracking-wide text-white shadow-lg ${color} border border-white/20`}
        style={{ transform: `rotate(${angle}deg) translateX(${radius}px) rotate(-${angle}deg)` }}
      >
        {label}
      </div>
    </div>
  )
}

// Animated terminal with typing effect
const TERMINAL_LINES = [
  { prompt: 'root@linux-market:~#', cmd: ' sudo apt install linux-market', color: 'text-green-400' },
  { prompt: '', cmd: 'Reading package lists... Done', color: 'text-slate-400' },
  { prompt: '', cmd: 'Setting up linux-market (1.0.0) ...', color: 'text-slate-400' },
  { prompt: '', cmd: 'Service started on http://localhost:3000', color: 'text-cyan-400' },
  { prompt: 'root@linux-market:~#', cmd: ' systemctl status linux-market', color: 'text-green-400' },
  { prompt: '', cmd: '● linux-market.service - Linux Market POS', color: 'text-white' },
  { prompt: '', cmd: '   Active: active (running) since now', color: 'text-emerald-400' },
  { prompt: 'root@linux-market:~#', cmd: ' _', color: 'text-green-400' },
]

function Terminal() {
  const [visibleLines, setVisibleLines] = useState(0)

  useEffect(() => {
    if (visibleLines >= TERMINAL_LINES.length) return
    const delays = [0, 800, 1600, 2200, 3000, 3600, 4200, 5000]
    const timers = delays.map((d, i) =>
      setTimeout(() => setVisibleLines(v => Math.max(v, i + 1)), d)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="w-72 rounded-xl overflow-hidden border border-white/15 shadow-2xl shadow-black/60 bg-[#0d1117] text-left">
      {/* Title bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#161b22] border-b border-white/10">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        <span className="ml-2 text-[9px] text-slate-500 font-mono">bash — linux-market</span>
      </div>
      {/* Content */}
      <div className="p-3 font-mono text-[10px] leading-5 min-h-[130px]">
        {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i} className={line.color}>
            {line.prompt && <span className="text-green-500">{line.prompt}</span>}
            <span>{line.cmd}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Free software manifesto quotes cycling
const QUOTES = [
  '"Free as in Freedom"',
  '"GNU/Linux Forever"',
  '"Software Libre para Todos"',
  '"Open Source Wins"',
  '"Run Linux, Be Free"',
]

export default function HeroAnimation() {
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setQuoteIdx(i => (i + 1) % QUOTES.length)
        setFade(true)
      }, 400)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full h-[580px] flex items-center justify-center select-none overflow-hidden">

      {/* Background grid */}
      <div className="absolute inset-0 hero-grid opacity-20" />

      {/* Deep glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full bg-primary/15 blur-[100px] animate-pulse-slow" />
      </div>

      {/* Outer orbital ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[420px] h-[420px] rounded-full border border-primary/15 animate-spin-slower" />
        <div className="absolute w-[340px] h-[340px] rounded-full border border-accent/10 animate-spin-reverse" />
      </div>

      {/* Distro badges orbiting */}
      <div className="absolute inset-0 flex items-center justify-center">
        <DistroBadge label="Debian"   angle={0}   radius={190} color="bg-red-700/80"    delay={0} />
        <DistroBadge label="Ubuntu"   angle={60}  radius={190} color="bg-orange-600/80" delay={0} />
        <DistroBadge label="Arch"     angle={120} radius={190} color="bg-blue-600/80"   delay={0} />
        <DistroBadge label="Fedora"   angle={180} radius={190} color="bg-blue-800/80"   delay={0} />
        <DistroBadge label="CentOS"   angle={240} radius={190} color="bg-purple-700/80" delay={0} />
        <DistroBadge label="Manjaro"  angle={300} radius={190} color="bg-green-700/80"  delay={0} />
      </div>

      {/* Inner counter-orbit dots */}
      <div className="absolute inset-0 flex items-center justify-center animate-spin-reverse">
        <div className="absolute w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/60" style={{ transform: 'translateX(150px)' }} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-accent/90" style={{ transform: 'translateY(-150px)' }} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400/80" style={{ transform: 'translateX(-150px)' }} />
        <div className="absolute w-2 h-2 rounded-full bg-primary/70" style={{ transform: 'translateY(150px)' }} />
      </div>

      {/* Main layout: Tux + Terminal side by side */}
      <div className="relative z-10 flex items-end gap-8">

        {/* Tux mascot — floating */}
        <div className="flex flex-col items-center gap-0 animate-float-badge" style={{ animationDuration: '3s' }}>
          <TuxSVG className="w-32 h-40 drop-shadow-[0_0_24px_rgba(139,92,246,0.6)]" />
          {/* GNU badge on belly */}
          <div className="mt-1 px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/40 text-[9px] font-bold text-primary tracking-widest">
            GNU / Linux
          </div>
        </div>

        {/* Terminal */}
        <Terminal />
      </div>

      {/* Cycling free software quote */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <div
          className="px-4 py-1.5 rounded-full bg-card/60 backdrop-blur border border-primary/20 text-[11px] font-mono text-primary/90 shadow-lg transition-opacity duration-400"
          style={{ opacity: fade ? 1 : 0 }}
        >
          {QUOTES[quoteIdx]}
        </div>
      </div>

      {/* Floating kernel version badges */}
      <FloatingBadge text="kernel 6.8.0" top="10%"  left="3%"   delay={0} />
      <FloatingBadge text="GPL v3"       top="18%"  right="4%"  delay={0.5} />
      <FloatingBadge text="systemd"      bottom="24%" left="2%"  delay={1} />
      <FloatingBadge text="bash 5.2"     bottom="14%" right="3%" delay={1.5} />

      {/* Particle stream */}
      {Array.from({ length: 14 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/50 animate-float-up"
          style={{
            left: `${12 + (i * 5.5) % 76}%`,
            animationDelay: `${i * 0.35}s`,
            animationDuration: `${2.2 + (i % 4) * 0.6}s`,
            bottom: 0,
          }}
        />
      ))}
    </div>
  )
}

function FloatingBadge({ text, top, left, right, bottom, delay }: {
  text: string; top?: string; left?: string; right?: string; bottom?: string; delay: number
}) {
  return (
    <div
      className="absolute px-2.5 py-1 rounded-full bg-card/80 backdrop-blur border border-primary/25 text-[10px] font-mono font-medium text-primary animate-float-badge shadow-lg shadow-primary/10"
      style={{ top, left, right, bottom, animationDelay: `${delay}s` }}
    >
      {text}
    </div>
  )
}
