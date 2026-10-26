import type { PropsWithChildren } from 'react'
import { Link } from 'react-router-dom'

export function AdminPageFrame({ children }: PropsWithChildren) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        to="/"
        className="text-sm font-medium text-stone-600 underline underline-offset-4 hover:text-emerald-900"
      >
        Back to city guides
      </Link>
      <div className="mt-7">{children}</div>
    </section>
  )
}
