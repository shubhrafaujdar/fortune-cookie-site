import { useCallback, useEffect, useRef, useState } from 'react'
import { Whisper } from './components/common.jsx'
import { GoldDefs } from './components/FortunePaper.jsx'
import FortuneRitual from './components/FortuneRitual.jsx'
import { AboutLantern, AccountTag, CategoryCord, JournalBook, SoundControls, Title } from './components/Hud.jsx'
import { AboutPanel, AccountPanel, JournalPanel, WaitPanel } from './components/Panels.jsx'
import ShopScene from './components/ShopScene.jsx'
import { FREE_FORTUNES, MEMBER_DAILY_FORTUNES } from './config.js'
import { useAuth } from './hooks/useAuth.js'
import { useFortuneShop } from './hooks/useFortuneShop.js'
import { useStageLayout } from './hooks/useStageLayout.js'
import { sound } from './lib/audio.js'
import { CATEGORY_BY_ID, LITTLE_MESSAGES, pick, SHOPKEEPER_NOTES } from './lib/fortuneEngine.js'
import { timeOfDay } from './lib/mood.js'

export default function App() {
  const auth = useAuth()
  const shop = useFortuneShop(auth.user?.id)
  const layout = useStageLayout()
  const jarRef = useRef(null)
  const [mood, setMood] = useState(timeOfDay)
  const [category, setCategory] = useState(null)
  const [jarState, setJarState] = useState('idle')
  const [ritual, setRitual] = useState(null)
  const [panel, setPanel] = useState(null)
  const [accountReason, setAccountReason] = useState(null)
  const [whisper, setWhisper] = useState(null)
  const firstTea = useRef(true)

  // ---- the one sound (the cookie crack). Browsers only allow audio to start
  // from a real tap/click/key, and Safari accepts only some event types, so
  // try on all of them until audio is running.
  useEffect(() => sound.setEnabled(shop.soundOn), [shop.soundOn])
  useEffect(() => {
    const events = ['pointerdown', 'pointerup', 'touchend', 'mousedown', 'click', 'keydown']
    const unlock = () => {
      sound.unlock()
      if (sound.running) events.forEach((e) => window.removeEventListener(e, unlock, true))
    }
    events.forEach((e) => window.addEventListener(e, unlock, true))
    return () => events.forEach((e) => window.removeEventListener(e, unlock, true))
  }, [])

  useEffect(() => {
    const id = setInterval(() => setMood(timeOfDay()), 5 * 60_000)
    return () => clearInterval(id)
  }, [])

  // The painting is wider than a phone screen. Older browsers without
  // overflow: clip can still nudge it sideways when something gets focus;
  // put it straight back.
  useEffect(() => {
    const fix = (e) => {
      const el = e.target
      if (el instanceof Element && (el.scrollLeft || el.scrollTop) && el.closest('.app') && !el.closest('.panel, .journal-leaf, .journal-left, .journal-spread')) {
        el.scrollLeft = 0
        el.scrollTop = 0
      }
      if (window.scrollX || window.scrollY) window.scrollTo(0, 0)
    }
    window.addEventListener('scroll', fix, true)
    return () => window.removeEventListener('scroll', fix, true)
  }, [])

  const say = useCallback((text) => setWhisper({ text, id: Date.now() + Math.random() }), [])
  useEffect(() => {
    if (!whisper) return
    const t = setTimeout(() => setWhisper(null), 3600)
    return () => clearTimeout(t)
  }, [whisper])

  const center = () => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 })

  /** Ask a guest to sign up; `reason` picks the message (limit, journal, tags, keep). */
  const askToJoin = useCallback((reason) => {
    setAccountReason(reason)
    setPanel('account')
  }, [])

  const showLimit = useCallback(
    (limit) => {
      if (limit === 'guest') askToJoin('limit')
      else setPanel('wait')
    },
    [askToJoin],
  )

  // ---- the jar
  const onJar = () => {
    if (ritual || jarState === 'shaking' || jarState === 'nudge') return
    const result = shop.draw(category)
    if (result.blocked) {
      setJarState('nudge')
      setTimeout(() => setJarState('idle'), 700)
      say(result.blocked === 'guest' ? 'The jar is locked. Sign up to open more.' : 'The jar is resting until midnight.')
      setTimeout(() => showLimit(result.blocked), 650)
      return
    }
    const { fortune, entry, resumed } = result
    if (resumed) {
      say('Your cookie is still waiting for you.')
      setRitual({ mode: 'cookie', fortune, entry, origin: center(), note: null })
      return
    }
    const r = jarRef.current.getBoundingClientRect()
    setJarState('shaking')
    setTimeout(() => setJarState('idle'), 1100)
    setRitual({
      mode: 'draw',
      fortune,
      entry,
      origin: { x: r.left + r.width * 0.5, y: r.top + r.height * 0.155 },
      rollWidth: Math.max(22, 50 * layout.scale),
      note: fortune.rarity === 'very-rare' || Math.random() < 0.18 ? pick(SHOPKEEPER_NOTES) : null,
    })
  }

  const closeRitual = useCallback(() => setRitual(null), [])
  const another = () => {
    setRitual(null)
    if (shop.limit) {
      setTimeout(() => showLimit(shop.limit), 350)
      return
    }
    setTimeout(() => jarRef.current?.click(), 500)
  }
  const keepCurrent = () => {
    if (!ritual) return
    if (!shop.isMember) {
      setRitual(null)
      setTimeout(() => askToJoin('keep'), 300)
      return
    }
    shop.keep(ritual.fortune.id, ritual.entry.at)
    setRitual(null)
    say('Kept in your journal.')
  }
  const onOpened = useCallback(() => ritual && shop.markOpened(ritual.entry.at), [ritual, shop])

  // ---- little objects in the shop
  const onProp = (name) => {
    if (name === 'teacup' && firstTea.current) {
      firstTea.current = false
      say('Your tea is ready.')
      return
    }
    say(pick(LITTLE_MESSAGES[name]))
  }

  const onTag = (id) => {
    if (!shop.isMember) {
      say('Choosing a category is for members.')
      askToJoin('tags')
      return
    }
    if (shop.limit) {
      say('Fresh cookies arrive at midnight.')
      return
    }
    setCategory((c) => (c === id ? null : id))
    if (category !== id) say(`The jar will listen for ${CATEGORY_BY_ID[id].label.toLowerCase()}.`)
  }

  const openJournal = () => {
    if (!shop.isMember) {
      askToJoin('journal')
      return
    }
    setPanel('journal')
  }

  const openAccount = () => {
    setAccountReason(null)
    setPanel('account')
  }

  // ---- accounts
  const onSignUp = async (details) => {
    const u = await auth.signUp(details)
    shop.carryGuestCookie(u.id)
    setPanel(null)
    say(`Welcome to the shop, ${u.name}. ${MEMBER_DAILY_FORTUNES} cookies are waiting for you today.`)
  }
  const onLogIn = async (details) => {
    const u = await auth.logIn(details)
    setPanel(null)
    say(`Welcome back, ${u.name}.`)
  }
  const onLogOut = async () => {
    await auth.logOut()
    setPanel(null)
    setCategory(null)
    say('Signed out. Come back soon.')
  }

  // ---- words that change with the visitor
  const jarHint = shop.pendingFortune
    ? 'Your cookie is waiting.'
    : shop.limit === 'guest'
      ? 'Sign up to unlock the jar.'
      : shop.limit === 'daily'
        ? 'Fresh cookies at midnight.'
        : 'Choose a little fortune.'

  const footnote = shop.isMember
    ? shop.left > 0
      ? `${shop.left} of today’s ${MEMBER_DAILY_FORTUNES} cookies left.`
      : 'That was today’s last cookie. More at midnight.'
    : shop.left > 0
      ? `${shop.left} free ${shop.left === 1 ? 'cookie' : 'cookies'} left.`
      : `That was your last free cookie (${FREE_FORTUNES} of ${FREE_FORTUNES}). Sign up for ${MEMBER_DAILY_FORTUNES} a day.`
  const anotherLabel = shop.limit === 'guest' ? 'Sign up for more' : shop.limit === 'daily' ? 'Back at midnight' : 'Another fortune'

  return (
    <main className={`app ${ritual ? 'has-ritual' : ''}`}>
      <GoldDefs />
      <ShopScene
        ref={jarRef}
        layout={layout}
        mood={mood}
        onJar={onJar}
        onProp={onProp}
        jarState={jarState}
        todayDrawn={!!shop.limit}
        jarHint={jarHint}
        jarLock={shop.limit}
      />

      <div className="hud" aria-hidden={!!ritual}>
        <Title />
        <AboutLantern onClick={() => setPanel('about')} />
        <AccountTag user={auth.user} left={shop.left} onClick={openAccount} />
        <JournalBook count={shop.kept.length} locked={!shop.isMember} onClick={openJournal} />
        <SoundControls on={shop.soundOn} onToggle={() => shop.setSoundOn((v) => !v)} />
        <CategoryCord selected={category} onSelect={onTag} locked={!shop.isMember} resting={shop.isMember && shop.limit === 'daily'} />
      </div>

      <Whisper whisper={whisper} />

      {ritual && (
        <FortuneRitual
          key={`${ritual.mode}-${ritual.fortune.id}-${ritual.entry.at}`}
          mode={ritual.mode}
          fortune={ritual.fortune}
          origin={ritual.origin}
          rollWidth={ritual.rollWidth || 40}
          note={ritual.note}
          footnote={footnote}
          anotherLabel={anotherLabel}
          isMember={shop.isMember}
          kept={shop.isKept(ritual.fortune.id, ritual.entry.at)}
          onOpened={onOpened}
          onKeep={keepCurrent}
          onClose={closeRitual}
          onAnother={another}
        />
      )}

      <JournalPanel
        open={panel === 'journal'}
        onClose={() => setPanel(null)}
        user={auth.user}
        kept={shop.kept}
        history={shop.history}
        isKept={shop.isKept}
        keep={shop.keep}
        unkeep={shop.unkeep}
        onUnfold={(fortune, entry) => {
          setPanel(null)
          setRitual({ mode: 'paper', fortune, entry, origin: center(), note: null })
        }}
      />
      <AccountPanel
        open={panel === 'account'}
        onClose={() => setPanel(null)}
        user={auth.user}
        reason={accountReason}
        freeLeft={shop.left}
        stats={{ opened: shop.history.length, kept: shop.kept.length }}
        onSignUp={onSignUp}
        onLogIn={onLogIn}
        onLogOut={onLogOut}
      />
      <WaitPanel open={panel === 'wait'} onClose={() => setPanel(null)} onJournal={() => setPanel('journal')} />
      <AboutPanel
        open={panel === 'about'}
        onClose={() => setPanel(null)}
        isMember={shop.isMember}
        onForget={() => {
          shop.forgetJournal()
          say('The journal is blank again.')
        }}
      />
    </main>
  )
}
