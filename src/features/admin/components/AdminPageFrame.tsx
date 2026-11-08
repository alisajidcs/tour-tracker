import type { PropsWithChildren } from 'react'
import {
  ArrowUpRight,
  Compass,
  ListOrdered,
  MapPinned,
  Upload,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/features/auth/AuthContext'

type AdminPageFrameProps = PropsWithChildren<{
  onOpenImport?: () => void
}>

export function AdminPageFrame({
  children,
  onOpenImport,
}: AdminPageFrameProps) {
  const auth = useAuth()
  const [isBusy, setIsBusy] = useState(false)

  async function signOut() {
    setIsBusy(true)
    await auth.signOut()
    setIsBusy(false)
  }

  return (
    <div className="min-h-screen bg-[#f5f6f7] text-[#20242a]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-[#e5e7eb] bg-white lg:flex">
        <Link
          to="/admin"
          className="flex h-16 items-center gap-3 border-b border-[#edf0f2] px-5"
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-[#26344a] text-white">
            <MapPinned size={17} aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-tight">
              Tour Tracker
            </span>
            <span className="block pt-0.5 text-[10px] font-semibold tracking-[0.16em] text-[#858c96] uppercase">
              Admin
            </span>
          </span>
        </Link>
        <nav aria-label="Admin navigation" className="flex-1 px-3 py-5">
          <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.14em] text-[#9299a2] uppercase">
            Workspace
          </p>
          <a
            href="#catalog"
            className="flex items-center gap-3 rounded-md bg-[#eef1f5] px-3 py-2.5 text-sm font-medium text-[#26344a]"
          >
            <ListOrdered size={16} aria-hidden="true" /> City catalog
          </a>
          {onOpenImport ? (
            <a
              href="#import"
              onClick={onOpenImport}
              className="mt-1 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[#5d6570] transition-colors hover:bg-[#f4f5f7] hover:text-[#26344a]"
            >
              <Upload size={16} aria-hidden="true" /> Import attractions
            </a>
          ) : null}
        </nav>
        <div className="border-t border-[#edf0f2] p-3">
          <Link
            to="/"
            className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-[#5d6570] hover:bg-[#f4f5f7] hover:text-[#26344a]"
          >
            <span className="flex items-center gap-3">
              <Compass size={16} aria-hidden="true" /> Public site
            </span>
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="flex min-h-14 items-center justify-between border-b border-[#e5e7eb] bg-white px-5 sm:px-8">
          <Link
            to="/"
            className="text-sm text-[#606873] hover:text-[#26344a] lg:hidden"
          >
            ← Public site
          </Link>
          <div className="hidden text-xs text-[#858c96] lg:block">
            Catalog management
          </div>
          {auth.user ? (
            <div className="flex items-center gap-3 text-xs text-[#737b86]">
              <span className="hidden sm:block">{auth.user.email}</span>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => void signOut()}
                className="font-medium text-[#45505e] hover:text-[#26344a] disabled:opacity-60"
              >
                {isBusy ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          ) : (
            <span className="text-xs text-[#858c96]">Administrator access</span>
          )}
        </header>
        <nav
          aria-label="Admin navigation"
          className="flex gap-1 overflow-x-auto border-b border-[#e5e7eb] bg-white px-4 py-2 lg:hidden"
        >
          <a
            href="#catalog"
            className="rounded-md bg-[#eef1f5] px-3 py-2 text-xs font-medium whitespace-nowrap text-[#26344a]"
          >
            City catalog
          </a>
          {onOpenImport ? (
            <a
              href="#import"
              onClick={onOpenImport}
              className="rounded-md px-3 py-2 text-xs whitespace-nowrap text-[#5d6570]"
            >
              Import attractions
            </a>
          ) : null}
        </nav>
        {auth.error ? (
          <div className="flex items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800 sm:px-8">
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
        <main className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 sm:py-9">
          {children}
        </main>
      </div>
    </div>
  )
}
