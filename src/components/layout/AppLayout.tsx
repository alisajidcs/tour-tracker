import { Compass, MapPin } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/features/auth/AuthContext'

export function AppLayout() {
  const auth = useAuth()
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
    <div className="flex min-h-screen flex-col bg-[#f7f7f4] text-stone-900">
      <header className="border-b border-stone-200/80 bg-[#f7f7f4]/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
            aria-label="Tour Tracker home"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-900 text-white">
              <MapPin aria-hidden="true" size={18} />
            </span>
            <span>Tour Tracker</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-stone-600 transition-colors hover:text-emerald-900"
            >
              <Compass aria-hidden="true" size={16} />
              <span className="hidden sm:inline">Explore</span>
            </Link>
            {auth.isLoading ? (
              <span className="text-sm text-stone-500">Checking account…</span>
            ) : auth.user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/admin"
                  className="text-sm font-medium text-stone-600 transition-colors hover:text-emerald-900"
                >
                  Manage
                </Link>
                <span className="hidden max-w-48 truncate text-sm text-stone-600 md:inline">
                  {auth.user.email}
                </span>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void handleSignOut()}
                  className="rounded-xl border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-white disabled:opacity-60"
                >
                  {isBusy ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => void handleSignIn()}
                className="rounded-xl bg-emerald-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:opacity-60 sm:px-4"
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
      <footer className="mt-12 border-t border-emerald-900/15 bg-[#132e28] text-[#f7f7f4]">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-[2fr_1fr_1fr] sm:px-8">
          <div>
            <Link
              to="/"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Compass size={24} aria-hidden="true" /> Tour Tracker
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-emerald-100/65">
              Good places. Curious days.
              <br />
              City guides that leave room for discovery.
            </p>
          </div>
          <nav aria-label="Footer navigation">
            <p className="mb-4 text-xs font-semibold tracking-[0.15em] text-emerald-100/50 uppercase">
              Explore
            </p>
            <Link to="/" className="text-sm hover:underline">
              All city guides
            </Link>
          </nav>
          <div>
            <p className="mb-4 text-xs font-semibold tracking-[0.15em] text-emerald-100/50 uppercase">
              Your journey
            </p>
            <p className="text-sm leading-7 text-emerald-100/65">
              Pick a city. Save your stops.
              <br />
              Make it your own.
            </p>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 border-t border-white/10 px-5 py-5 text-xs text-emerald-100/50 sm:px-8">
          <span>Tour Tracker &copy; {new Date().getFullYear()}</span>
          <span>Made for the places you have yet to see.</span>
        </div>
      </footer>
    </div>
  )
}
