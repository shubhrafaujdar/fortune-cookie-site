import { forwardRef, useState } from 'react'
import { FallingPetals, LanternGlow, RainWindow, Steam } from './Atmosphere.jsx'
import { asset } from '../lib/assets.js'
import { LockIcon } from './common.jsx'
import { STAGE_H, STAGE_W } from '../hooks/useStageLayout.js'

// Prop placement in painting pixels (the painting is 1412 × 928).
// `p` overrides apply on tall phone screens, where only the middle of the
// counter is visible.
const PROPS = {
  teapot: { left: 380, top: 690, width: 236, p: null },
  jar: { left: 610, top: 342, width: 320, p: { left: 638, top: 410, width: 264 } },
  teacup: { left: 955, top: 704, width: 166, p: { left: 902, top: 738, width: 120 } },
  cookie: { left: 1132, top: 745, width: 104, p: null },
  slipA: { left: 870, top: 812, width: 96, rot: 9, p: null },
  slipB: { left: 1085, top: 836, width: 124, rot: -5, p: null },
  cat: { left: 1288, top: 630, width: 116, p: { left: 950, top: 536, width: 82 } },
}

const LANTERNS = [
  { x: 383, y: 220, r: 150, d: 0, hit: { left: 318, top: 110, width: 130, height: 200 } },
  { x: 1047, y: 225, r: 150, d: 1.7, hit: { left: 985, top: 120, width: 125, height: 190 } },
  { x: 1290, y: 140, r: 120, d: 0.9, hit: { left: 1225, top: 60, width: 130, height: 140 } },
]

function place(spec, portrait) {
  const s = portrait && spec.p !== undefined ? spec.p : spec
  if (!s) return null
  return { left: s.left, top: s.top, width: s.width, '--rot': `${s.rot || 0}deg` }
}

const ShopScene = forwardRef(function ShopScene(
  { layout, mood, onJar, onProp, jarState, todayDrawn, jarHint, jarLock },
  jarRef,
) {
  const { scale, x, y, portrait } = layout
  const [puff, setPuff] = useState(0)
  const [catWave, setCatWave] = useState(0)
  const [flare, setFlare] = useState(-1)

  const stageStyle = { width: STAGE_W, height: STAGE_H, transform: `translate(${x}px, ${y}px) scale(${scale})` }
  const prop = (name, key) => () => onProp(name, key)

  return (
    <div className={`shop mood-${mood} ${portrait ? 'is-portrait' : ''}`} style={{ '--seam': `${Math.max(0, y)}px` }}>
      {portrait && <div className="shop-backdrop" style={{ backgroundImage: `url(${asset('scene/shop-interior.webp')})` }} aria-hidden="true" />}
      <div className="stage" style={stageStyle}>
        <img className="scene-art" src={asset('scene/shop-interior.webp')} alt="Inside a small Japanese tea shop on a rainy evening: lanterns, shelves of teapots, a rainy window and a long wooden counter." draggable="false" />
        <RainWindow x={452} y={118} w={642} h={466} />
        <div className="mood-tint" aria-hidden="true" />
        {LANTERNS.map((l, i) => (
          <LanternGlow key={i} x={l.x} y={l.y} r={l.r} delay={l.d} strong={flare === i ? 1.7 : 1} />
        ))}
        <FallingPetals count={portrait ? 4 : 8} area={{ x: 10, y: 20, w: 330, h: 760 }} />

        {/* painted features you can touch */}
        {LANTERNS.map((l, i) => (
          <button
            key={i}
            type="button"
            className="hotspot"
            style={l.hit}
            aria-label="Paper lantern"
            onClick={() => {
              setFlare(i)
              setTimeout(() => setFlare(-1), 1200)
              onProp('lantern', 'chime')
            }}
          />
        ))}
        <button type="button" className="hotspot" style={{ left: 455, top: 122, width: 150, height: 455 }} aria-label="Rainy window" onClick={prop('window', 'tick')} />
        <button type="button" className="hotspot" style={{ left: 935, top: 330, width: 155, height: 160 }} aria-label="Rainy window" onClick={prop('window', 'tick')} />
        <button type="button" className="hotspot" style={{ left: 1240, top: 248, width: 132, height: 275 }} aria-label="Fortune banner" onClick={prop('banner', 'chime')} />
        <button type="button" className="hotspot" style={{ left: 190, top: 400, width: 260, height: 390 }} aria-label="Vase of cherry blossoms" onClick={prop('vase', 'tick')} />

        {/* objects on the counter */}
        {place(PROPS.teapot, portrait) && (
          <button type="button" className="prop teapot" style={place(PROPS.teapot, portrait)} onClick={prop('teapot', 'ceramic')} aria-label="Iron teapot">
            <img src={asset('objects/teapot-set.webp')} alt="" draggable="false" />
          </button>
        )}
        {place(PROPS.slipA, portrait) && (
          <button type="button" className="prop slip" style={place(PROPS.slipA, portrait)} onClick={prop('slips', 'rustle')} aria-label="Loose paper fortunes">
            <img src={asset('paper/slip-plain.webp')} alt="" draggable="false" />
          </button>
        )}
        {place(PROPS.slipB, portrait) && (
          <button type="button" className="prop slip" style={place(PROPS.slipB, portrait)} onClick={prop('slips', 'rustle')} aria-label="Loose paper fortunes">
            <img src={asset('paper/scroll-long.webp')} alt="" draggable="false" />
          </button>
        )}

        <div className={`jar-hint ${todayDrawn ? 'is-drawn' : ''}`} style={{ left: 770, top: portrait ? 300 : 236 }} aria-hidden="true">
          <span>{jarHint}</span>
          <svg viewBox="0 0 60 64">
            <path d="M22 4 C 10 18, 12 34, 28 44 C 31 46, 33 49, 34 56" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M26 49 L 34.5 58 L 41 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <button
          ref={jarRef}
          type="button"
          className={`prop jar jar-${jarState} ${todayDrawn ? 'is-drawn' : ''} ${jarLock ? `is-locked lock-${jarLock}` : ''}`}
          style={place(PROPS.jar, portrait)}
          onClick={onJar}
          aria-label={jarLock === 'guest' ? 'Fortune jar, locked: sign up to open more' : jarLock === 'daily' ? 'Fortune jar, resting until midnight' : 'Fortune jar: choose a little fortune'}
        >
          <span className="jar-glow" aria-hidden="true" />
          <img src={asset('objects/fortune-jar.webp')} alt="" draggable="false" />
          {jarLock === 'guest' && (
            <span className="jar-padlock" aria-hidden="true">
              <svg className="padlock-chain" viewBox="0 0 20 60">
                <path d="M10 0 C 6 14, 14 26, 10 40 S 8 54, 10 60" fill="none" stroke="#8a6a3c" strokeWidth="2.4" strokeDasharray="5 3" />
              </svg>
              <LockIcon />
            </span>
          )}
          {jarLock === 'daily' && (
            <span className="jar-closed-sign" aria-hidden="true">
              <svg className="sign-strings" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path d="M50 0 L16 30 M50 0 L84 30" stroke="#8a3b2c" strokeWidth="1.6" fill="none" vectorEffect="non-scaling-stroke" />
              </svg>
              <span className="sign-board">
                <img src={asset('ui/button-blank.webp')} alt="" />
                <span>Closed until 12 am</span>
              </span>
            </span>
          )}
        </button>

        <button
          type="button"
          className="prop teacup"
          style={place(PROPS.teacup, portrait)}
          onClick={() => {
            setPuff((n) => n + 1)
            onProp('teacup', 'ceramic')
          }}
          aria-label="Cup of green tea"
        >
          <Steam key={puff} className={puff ? 'puff' : ''} />
          <img src={asset('objects/teacup.webp')} alt="" draggable="false" />
        </button>

        {place(PROPS.cookie, portrait) && (
          <button type="button" className="prop cookie" style={place(PROPS.cookie, portrait)} onClick={prop('cookie', 'tick')} aria-label="A fortune cookie">
            <img src={asset('cookies/cookie-whole.webp')} alt="" draggable="false" />
          </button>
        )}

        <button
          type="button"
          className={`prop cat ${catWave % 2 ? 'wave-a' : catWave ? 'wave-b' : ''}`}
          style={place(PROPS.cat, portrait)}
          onClick={() => {
            setCatWave((n) => n + 1)
            onProp('cat', 'chime')
          }}
          aria-label="The shop cat"
        >
          <img src={asset('objects/lucky-cat.webp')} alt="" draggable="false" />
        </button>
      </div>
      <div className="paper-grain" style={{ backgroundImage: `url(${asset('textures/paper-grain.webp')})` }} aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
    </div>
  )
})

export default ShopScene
