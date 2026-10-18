import { MapPin } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f7f7f4] text-stone-900">
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
          <span className="text-sm text-stone-500">
            A little more exploring
          </span>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="mx-auto max-w-6xl px-5 py-8 text-xs text-stone-500 sm:px-8">
        Made for the places you haven’t seen yet.
      </footer>
    </div>
  )
}
