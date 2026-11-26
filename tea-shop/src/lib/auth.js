// Sign-in for the shop: Google accounts only, through Firebase Authentication.
// Firebase is loaded in the background after the shop opens, so it never slows
// down the first paint.

import { firebaseConfig } from './firebaseConfig.js'

export class AuthError extends Error {}

const FRIENDLY = {
  'auth/unauthorized-domain':
    'Google sign-in is not allowed on this web address yet. (Add it in Firebase → Authentication → Settings → Authorized domains.)',
  'auth/operation-not-allowed': 'Google sign-in is not switched on yet. (Firebase → Authentication → Sign-in method → Google.)',
  'auth/network-request-failed': 'The internet connection dropped. Please try again.',
  'auth/too-many-requests': 'Too many tries. Please wait a moment and try again.',
  'auth/internal-error': 'Google sign-in hit a snag. Please try again.',
}

function toUser(u) {
  if (!u) return null
  const name = (u.displayName || u.email || 'Friend').split(/[\s@]/)[0]
  return {
    id: u.uid,
    name,
    fullName: u.displayName || name,
    email: u.email || '',
    photo: u.photoURL || null,
    createdAt: Date.parse(u.metadata?.creationTime || '') || Date.now(),
  }
}

// ------------------------------------------------------------------ Firebase
let ready = null
function firebase() {
  ready ||= Promise.all([import('firebase/app'), import('firebase/auth')]).then(([app, auth]) => {
    const instance = auth.getAuth(app.initializeApp(firebaseConfig))
    const provider = new auth.GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    return { auth, instance, provider }
  })
  return ready
}

const realAuth = {
  /** Calls back with the signed-in user (or null) now and whenever it changes. */
  watch(callback) {
    let unsub = () => {}
    let cancelled = false
    firebase()
      .then(({ auth, instance }) => {
        if (cancelled) return
        auth.getRedirectResult(instance).catch(() => {})
        unsub = auth.onAuthStateChanged(instance, (u) => callback(toUser(u)))
      })
      .catch(() => callback(null))
    return () => {
      cancelled = true
      unsub()
    }
  },

  /** Opens Google's account chooser. Returns the user, or null if the window was closed. */
  async signInWithGoogle() {
    const { auth, instance, provider } = await firebase()
    try {
      const result = await auth.signInWithPopup(instance, provider)
      return toUser(result.user)
    } catch (err) {
      const code = err?.code || ''
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return null
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-environment') {
        await auth.signInWithRedirect(instance, provider) // the page navigates to Google and back
        return null
      }
      throw new AuthError(FRIENDLY[code] || 'Could not sign in with Google. Please try again.')
    }
  },

  async logOut() {
    const { auth, instance } = await firebase()
    await auth.signOut(instance)
  },
}

// ------------------------------------------------------------------ test double
// Only included in builds made with `vite build --mode e2e` (used by the
// automated browser tests); production builds drop this code entirely.
const fakeAuth = {
  watch(callback) {
    const read = () => JSON.parse(localStorage.getItem('e2e-user') || 'null')
    callback(read())
    const on = () => callback(read())
    window.addEventListener('e2e-auth', on)
    return () => window.removeEventListener('e2e-auth', on)
  },
  async signInWithGoogle() {
    const u = { id: 'e2e-user-1', name: 'Mei', fullName: 'Mei Tanaka', email: 'mei@example.com', photo: null, createdAt: Date.now() }
    localStorage.setItem('e2e-user', JSON.stringify(u))
    window.dispatchEvent(new Event('e2e-auth'))
    return u
  },
  async logOut() {
    localStorage.removeItem('e2e-user')
    window.dispatchEvent(new Event('e2e-auth'))
  },
}

export const auth = import.meta.env.VITE_FAKE_AUTH === 'true' ? fakeAuth : realAuth
