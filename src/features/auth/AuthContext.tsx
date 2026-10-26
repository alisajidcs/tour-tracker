import type { Session, User } from '@supabase/supabase-js'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { supabase } from '@/lib/supabase'

type AuthContextValue = {
  user: User | null
  isLoading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(supabase))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    let active = true
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setIsLoading(false)
      setError(null)
    })

    void supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) return
        if (sessionError) setError(sessionError.message)
        else setSession(data.session)
        setIsLoading(false)
      })
      .catch((sessionError: unknown) => {
        if (!active) return
        setError(
          sessionError instanceof Error
            ? sessionError.message
            : 'Could not check your sign-in status.',
        )
        setIsLoading(false)
      })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      setError('Sign-in is unavailable until Supabase is configured.')
      return
    }

    setError(null)
    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (signInError) setError(signInError.message)
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : 'Could not start Google sign-in.',
      )
    }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    setError(null)
    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) setError(signOutError.message)
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : 'Could not sign out.',
      )
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isLoading,
      error,
      signInWithGoogle,
      signOut,
      clearError: () => setError(null),
    }),
    [session, isLoading, error, signInWithGoogle, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth must be used inside AuthProvider.')
  return auth
}
