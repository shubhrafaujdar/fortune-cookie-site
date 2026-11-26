import { useCallback, useEffect, useState } from 'react'
import { auth } from '../lib/auth.js'

/** The signed-in Google user (or null). `ready` turns true once we know. */
export function useAuth() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(
    () =>
      auth.watch((u) => {
        setUser(u)
        setReady(true)
      }),
    [],
  )

  const signIn = useCallback(async () => {
    const u = await auth.signInWithGoogle()
    if (u) setUser(u)
    return u
  }, [])

  const logOut = useCallback(async () => {
    await auth.logOut()
    setUser(null)
  }, [])

  return { user, ready, signIn, logOut }
}
