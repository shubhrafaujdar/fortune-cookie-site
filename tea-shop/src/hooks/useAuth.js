import { useCallback, useState } from 'react'
import * as auth from '../lib/auth.js'

export function useAuth() {
  const [user, setUser] = useState(() => auth.currentUser())

  const signUp = useCallback(async (details) => {
    const u = await auth.signUp(details)
    setUser(u)
    return u
  }, [])

  const logIn = useCallback(async (details) => {
    const u = await auth.logIn(details)
    setUser(u)
    return u
  }, [])

  const logOut = useCallback(async () => {
    await auth.logOut()
    setUser(null)
  }, [])

  return { user, signUp, logIn, logOut }
}
