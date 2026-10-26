import { AlertCircle, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

type QueryStateProps = {
  title: string
  message: string
  onRetry?: () => void
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div
      className="flex min-h-64 flex-col items-center justify-center gap-3 text-stone-500"
      role="status"
    >
      <LoaderCircle
        aria-hidden="true"
        className="animate-spin text-emerald-800"
        size={28}
      />
      <span>{label}</span>
    </div>
  )
}

export function EmptyState({
  title,
  message,
}: Omit<QueryStateProps, 'onRetry'>) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white/50 px-6 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-900">
        <AlertCircle aria-hidden="true" size={22} />
      </span>
      <h2 className="text-lg font-medium text-stone-900">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-stone-600">
        {message}
      </p>
    </div>
  )
}

export function ErrorState({ title, message, onRetry }: QueryStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-rose-200 bg-rose-50/70 px-6 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-white text-rose-700">
        <AlertCircle aria-hidden="true" size={22} />
      </span>
      <h2 className="text-lg font-medium text-stone-900">{title}</h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-stone-700">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
