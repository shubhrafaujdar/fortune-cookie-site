import { useEffect, useMemo, useRef } from 'react'

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Rain falling outside and drops sliding down the glass. Lives in stage pixels. */
export function RainWindow({ x, y, w, h, paused = false }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)
    const calm = reducedMotion()
    const streaks = Array.from({ length: calm ? 25 : 110 }, () => newStreak(true))
    const drops = Array.from({ length: calm ? 6 : 22 }, () => newDrop(true))
    function newStreak(anywhere) {
      return { x: Math.random() * (w + 60) - 30, y: anywhere ? Math.random() * h : -30 - Math.random() * 60, len: 14 + Math.random() * 26, v: 5 + Math.random() * 5, a: 0.08 + Math.random() * 0.16 }
    }
    function newDrop(anywhere) {
      return { x: Math.random() * w, y: anywhere ? Math.random() * h : Math.random() * h * 0.4, r: 1.4 + Math.random() * 2.6, v: 0, pause: Math.random() * 200, trail: [] }
    }
    let raf
    let last = performance.now()
    if (paused) {
      ctx.clearRect(0, 0, w, h)
      return undefined
    }
    const frame = (now) => {
      if (document.hidden) {
        raf = requestAnimationFrame(frame)
        return
      }
      const dt = Math.min(3, (now - last) / 16.7)
      last = now
      ctx.clearRect(0, 0, w, h)
      // falling rain beyond the glass
      ctx.lineCap = 'round'
      for (const s of streaks) {
        s.y += s.v * dt * (calm ? 0.4 : 1)
        s.x -= 0.6 * dt
        if (s.y > h + 20) Object.assign(s, newStreak(false))
        ctx.strokeStyle = `rgba(214,226,240,${s.a})`
        ctx.lineWidth = 1.1
        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(s.x - 2.5, s.y + s.len)
        ctx.stroke()
      }
      // drops on the glass: stick, then slide in little jumps
      for (const d of drops) {
        if (d.pause > 0) d.pause -= dt
        else {
          d.v = Math.min(d.v + 0.04 * dt, 1.6)
          d.y += d.v * dt * (calm ? 0.3 : 1)
          d.x += (Math.random() - 0.5) * 0.25
          d.trail.push([d.x, d.y])
          if (d.trail.length > 40) d.trail.shift()
          if (Math.random() < 0.012) {
            d.pause = 30 + Math.random() * 140
            d.v = 0
          }
        }
        if (d.y > h + 10) Object.assign(d, newDrop(false))
        if (d.trail.length > 2) {
          ctx.strokeStyle = 'rgba(220,232,245,0.10)'
          ctx.lineWidth = d.r * 0.7
          ctx.beginPath()
          d.trail.forEach(([tx, ty], i) => (i ? ctx.lineTo(tx, ty) : ctx.moveTo(tx, ty)))
          ctx.stroke()
        }
        const g = ctx.createRadialGradient(d.x - d.r * 0.3, d.y - d.r * 0.4, 0.2, d.x, d.y, d.r)
        g.addColorStop(0, 'rgba(255,248,230,0.55)')
        g.addColorStop(0.6, 'rgba(190,205,225,0.18)')
        g.addColorStop(1, 'rgba(40,50,70,0.22)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.ellipse(d.x, d.y, d.r * 0.85, d.r, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [w, h, paused])
  return <canvas ref={ref} className="rain-window" style={{ left: x, top: y, width: w, height: h }} aria-hidden="true" />
}

/** Warm light pooled around a painted lantern, breathing like a candle. */
export function LanternGlow({ x, y, r, delay = 0, strong = 1 }) {
  return (
    <div
      className="lantern-glow"
      style={{ left: x - r, top: y - r, width: r * 2, height: r * 2, animationDelay: `${delay}s`, '--strength': strong }}
      aria-hidden="true"
    />
  )
}

/** Soft rising steam. */
export function Steam({ className = '', style }) {
  return (
    <svg className={`steam ${className}`} style={style} viewBox="0 0 80 140" aria-hidden="true">
      <defs>
        <filter id="steam-blur" x="-50%" y="-20%" width="200%" height="140%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
      </defs>
      <g filter="url(#steam-blur)" fill="none" stroke="#f3e6cf" strokeLinecap="round">
        <path className="wisp w1" d="M30 135 C 18 110, 44 96, 30 72 S 22 34, 36 8" strokeWidth="7" />
        <path className="wisp w2" d="M48 135 C 60 112, 36 98, 50 74 S 58 40, 44 12" strokeWidth="6" />
        <path className="wisp w3" d="M40 135 C 30 118, 52 100, 40 82 S 34 52, 42 30" strokeWidth="5" />
      </g>
    </svg>
  )
}

/** A few cherry petals drifting down. Positions are in the parent's coordinates. */
export function FallingPetals({ count = 7, area = { x: 0, y: 0, w: 400, h: 600 } }) {
  const petals = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: area.x + Math.random() * area.w,
        top: area.y + Math.random() * area.h * 0.3,
        delay: -Math.random() * 18 + i * 0.3,
        dur: 13 + Math.random() * 10,
        size: 9 + Math.random() * 8,
        drift: 60 + Math.random() * 140,
        fall: area.h * (0.6 + Math.random() * 0.4),
        spin: Math.random() > 0.5 ? 1 : -1,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count],
  )
  return petals.map((p, i) => (
    <svg
      key={i}
      className="petal"
      viewBox="0 0 20 20"
      style={{ left: p.left, top: p.top, width: p.size, height: p.size, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`, '--drift': `${p.drift}px`, '--fall': `${p.fall}px`, '--spin': p.spin }}
      aria-hidden="true"
    >
      <path d="M10 1 C 16 4, 19 11, 10 19 C 1 11, 4 4, 8.6 3.4 L 10 6 Z" fill="#eaa3a6" stroke="#b85f6a" strokeWidth=".8" opacity=".9" />
      <path d="M10 6 L 10 15" stroke="#c97a83" strokeWidth=".6" opacity=".6" />
    </svg>
  ))
}
