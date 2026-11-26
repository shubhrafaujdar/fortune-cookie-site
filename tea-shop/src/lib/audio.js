// The shop's only sound: the crack when a fortune cookie is opened.
// Made with the Web Audio API, so there are no sound files to load.
// Nothing is created or played until the visitor taps or clicks something.

let ctx = null
let out = null
let noise = null
let keepAlive = null
let enabled = true

function ensure() {
  if (ctx) return ctx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  // a gentle limiter keeps the crack crisp and loud without crackling
  const limiter = ctx.createDynamicsCompressor()
  limiter.threshold.value = -8
  limiter.ratio.value = 8
  limiter.attack.value = 0.002
  limiter.release.value = 0.15
  limiter.connect(ctx.destination)
  out = ctx.createGain()
  out.gain.value = 2.2
  out.connect(limiter)
  const len = Math.floor(ctx.sampleRate * 1)
  noise = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = noise.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  return ctx
}

// iPhone/iPad: the ring/silent switch mutes web audio unless the page asks to
// be treated as media playback (newer iOS) or is playing an <audio> element
// (older iOS). Do both. The silent clip must have a real length: looping a
// zero-length clip makes the browser restart it nonstop and the page lags.
function silentWavUrl(seconds = 1, rate = 8000) {
  const n = Math.floor(seconds * rate)
  const buf = new ArrayBuffer(44 + n)
  const v = new DataView(buf)
  const str = (o, t) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)))
  str(0, 'RIFF')
  v.setUint32(4, 36 + n, true)
  str(8, 'WAVE')
  str(12, 'fmt ')
  v.setUint32(16, 16, true) // fmt chunk size
  v.setUint16(20, 1, true) // PCM
  v.setUint16(22, 1, true) // mono
  v.setUint32(24, rate, true)
  v.setUint32(28, rate, true) // byte rate (8-bit mono)
  v.setUint16(32, 1, true) // block align
  v.setUint16(34, 8, true) // bits per sample
  str(36, 'data')
  v.setUint32(40, n, true)
  new Uint8Array(buf, 44).fill(128) // 8-bit silence is 128
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }))
}

function iosPlaybackMode() {
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback'
  } catch {
    /* not supported */
  }
  if (keepAlive) return
  try {
    keepAlive = new Audio(silentWavUrl())
    keepAlive.loop = true
    keepAlive.setAttribute('playsinline', '')
    keepAlive.volume = 0.01
    keepAlive.play().catch(() => {})
  } catch {
    /* ignore */
  }
}

function burst(at, dur, freq, q, gain, type = 'bandpass') {
  const t = ctx.currentTime + at
  const src = ctx.createBufferSource()
  src.buffer = noise
  const f = ctx.createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  f.Q.value = q
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.0015)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(f).connect(g).connect(out)
  src.start(t, Math.random() * 0.8)
  src.stop(t + dur + 0.03)
}

/** A crisp, biscuity snap followed by a few tiny crumbles. */
function crack() {
  const r = (a, b) => a + Math.random() * (b - a)
  burst(0, 0.035, 2400, 0.8, 0.5, 'highpass')
  burst(0.012, 0.06, 1300, 1.1, 0.35)
  burst(0.03, 0.08, 700, 0.9, 0.18)
  for (let i = 0; i < 7; i++) burst(0.06 + i * r(0.014, 0.04), r(0.012, 0.03), r(2800, 7000), 2, r(0.06, 0.16))
}

export const sound = {
  /** Call from a tap, click or key press. */
  unlock() {
    if (!enabled || !ensure()) return
    iosPlaybackMode()
    if (ctx.state !== 'running') ctx.resume().catch(() => {})
  },
  crack() {
    if (!enabled || !ensure()) return
    if (ctx.state !== 'running') ctx.resume().catch(() => {})
    crack()
  },
  setEnabled(on) {
    enabled = !!on
  },
  get running() {
    return !!ctx && ctx.state === 'running'
  },
}
