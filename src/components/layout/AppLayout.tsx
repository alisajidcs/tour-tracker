import { Compass, MapPin } from 'lucide-react'
import { Link, Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { useLayoutEffect, useState } from 'react'
import { useAuth } from '@/features/auth/AuthContext'

export function AppLayout() {
  const auth = useAuth()
  const { pathname, hash } = useLocation()
  const navigationType = useNavigationType()
  useLayoutEffect(() => {
    if (navigationType !== 'POP' && !hash && window.scrollY) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [hash, navigationType, pathname])
  const [isBusy, setIsBusy] = useState(false)

  async function handleSignIn() {
    setIsBusy(true)
    await auth.signInWithGoogle()
    setIsBusy(false)
  }

  async function handleSignOut() {
    setIsBusy(true)
    await auth.signOut()
    setIsBusy(false)
  }

  return (
    <div className="guide-app bg-guide-page text-guide-ink flex min-h-screen flex-col">
      <header className="border-guide-line bg-guide-surface border-b">
        <div className="guide-shell flex items-center justify-between gap-2 py-2.5 sm:py-3">
          <Link
            to="/"
            className="flex min-h-11 shrink-0 items-center gap-2 font-bold tracking-tight"
            aria-label="Tour Tracker home"
          >
            <span className="bg-guide-accent grid size-8 place-items-center rounded-lg text-white">
              <MapPin aria-hidden="true" size={18} />
            </span>
            <span>Tour Tracker</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-4">
            <Link to="/" className="guide-text-link min-w-11 gap-1.5 px-2">
              <Compass aria-hidden="true" size={16} />
              <span className="sr-only sm:not-sr-only">Explore</span>
            </Link>
            {auth.isLoading ? (
              <span className="text-sm text-stone-500">Checking account…</span>
            ) : auth.user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link to="/admin" className="guide-text-link">
                  Manage
                </Link>
                <span className="hidden max-w-48 truncate text-sm text-stone-600 md:inline">
                  {auth.user.email}
                </span>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void handleSignOut()}
                  className="guide-control"
                >
                  {isBusy ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => void handleSignIn()}
                className="guide-control guide-primary px-2.5 text-xs sm:px-4 sm:text-sm"
              >
                {isBusy ? 'Opening Google…' : 'Sign in with Google'}
              </button>
            )}
          </div>
        </div>
        {auth.error ? (
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 pb-3 text-sm text-red-800 sm:px-8">
            <p role="alert">{auth.error}</p>
            <button
              type="button"
              onClick={auth.clearError}
              className="shrink-0 font-semibold underline underline-offset-2"
            >
              Dismiss
            </button>
          </div>
        ) : null}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-guide-line bg-guide-soft mt-10 border-t">
        <div className="guide-shell text-guide-muted flex flex-wrap items-center justify-between gap-x-5 py-3 text-sm">
          <span>Tour Tracker &copy; {new Date().getFullYear()}</span>
          <Link to="/" className="guide-text-link">
            All city guides
          </Link>
        </div>
      </footer>
    </div>
  )
}
