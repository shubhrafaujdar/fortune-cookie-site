import { useEffect, useState } from 'react'

// The shop painting is a fixed-size "stage" (in painting pixels). Every prop is
// positioned in stage pixels, and the whole stage is scaled to the viewport.
export const STAGE_W = 1412
export const STAGE_H = 928
const FOCUS_X = 770 // the jar
const MIN_VISIBLE_W = 520 // on tall phones keep at least this much of the counter

function compute() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  let scale = Math.max(vw / STAGE_W, vh / STAGE_H)
  let portrait = false
  if (vw / scale < MIN_VISIBLE_W) {
    scale = vw / MIN_VISIBLE_W
    portrait = true
  }
  const w = STAGE_W * scale
  const h = STAGE_H * scale
  let x = vw / 2 - FOCUS_X * scale
  x = Math.min(0, Math.max(vw - w, x))
  // landscape: keep the counter in view (crop more from the ceiling)
  // portrait: sit the painting on the bottom edge; a soft backdrop fills the top
  const y = portrait ? vh - h : Math.min(0, (vh - h) * 0.75)
  return { scale, x, y, vw, vh, portrait }
}

export function useStageLayout() {
  const [layout, setLayout] = useState(compute)
  useEffect(() => {
    let raf = 0
    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setLayout(compute()))
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])
  return layout
}
