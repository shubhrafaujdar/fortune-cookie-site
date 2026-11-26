// Accounts for the shop.
//
// This is the ONLY file that knows where accounts live. Right now accounts are
// kept in this browser (passwords are salted and hashed with PBKDF2, never
// stored as text). To move to real server accounts (Supabase, Firebase, your
// own API…), replace the bodies of signUp / logIn / logOut / currentUser with
// calls to that service; the rest of the app only uses these four functions.

import { load, save } from './storage.js'

const ITERATIONS = 150_000
const enc = new TextEncoder()

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
const fromHex = (hex) => new Uint8Array(hex.match(/.{2}/g).map((h) => parseInt(h, 16)))

async function hashPassword(password, saltHex) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: fromHex(saltHex), iterations: ITERATIONS, hash: 'SHA-256' }, key, 256)
  return toHex(bits)
}

export class AuthError extends Error {
  constructor(message, field) {
    super(message)
    this.field = field
  }
}

const normEmail = (e) => e.trim().toLowerCase()
const publicUser = (a) => ({ id: a.id, name: a.name, email: a.email, createdAt: a.createdAt })

export function validateSignUp({ name, email, password }) {
  if (!name?.trim()) throw new AuthError('Please tell the shopkeeper your name.', 'name')
  if (name.trim().length > 40) throw new AuthError('That name is a little long for the journal cover.', 'name')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim() || '')) throw new AuthError('That email does not look quite right.', 'email')
  if ((password || '').length < 8) throw new AuthError('Use at least 8 characters for your password.', 'password')
}

export async function signUp({ name, email, password }) {
  validateSignUp({ name, email, password })
  const accounts = load('accounts', {})
  const key = normEmail(email)
  if (accounts[key]) throw new AuthError('There is already an account with that email. Try logging in.', 'email')
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)))
  const account = {
    id: `u_${toHex(crypto.getRandomValues(new Uint8Array(8)))}`,
    name: name.trim(),
    email: key,
    salt,
    hash: await hashPassword(password, salt),
    createdAt: Date.now(),
  }
  save('accounts', { ...accounts, [key]: account })
  save('session', { userId: account.id, email: key })
  return publicUser(account)
}

export async function logIn({ email, password }) {
  const account = load('accounts', {})[normEmail(email || '')]
  if (!account) throw new AuthError('No account with that email yet. Sign up instead?', 'email')
  if ((await hashPassword(password || '', account.salt)) !== account.hash) throw new AuthError('That password does not match.', 'password')
  save('session', { userId: account.id, email: account.email })
  return publicUser(account)
}

export async function logOut() {
  save('session', null)
}

export function currentUser() {
  const s = load('session', null)
  if (!s) return null
  const account = load('accounts', {})[s.email]
  return account && account.id === s.userId ? publicUser(account) : null
}
