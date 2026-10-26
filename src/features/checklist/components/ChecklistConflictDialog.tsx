import type { ChecklistConflictChoice } from '@/features/checklist/conflicts'

type ChecklistConflictDialogProps = {
  localCount: number
  cloudCount: number
  isResolving: boolean
  error: string | null
  onResolve: (choice: ChecklistConflictChoice) => void
}

export function ChecklistConflictDialog({
  localCount,
  cloudCount,
  isResolving,
  error,
  onResolve,
}: ChecklistConflictDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="checklist-conflict-title"
        className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl sm:p-8"
      >
        <p className="text-sm font-medium text-emerald-800">Checklist sync</p>
        <h2
          id="checklist-conflict-title"
          className="mt-2 text-2xl font-semibold tracking-tight text-stone-950"
        >
          You have progress in two places
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Choose how to combine your {localCount} saved guest stops with your{' '}
          {cloudCount} account stops. Your guest progress is kept until this
          choice syncs successfully.
        </p>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            disabled={isResolving}
            onClick={() => onResolve('merge')}
            className="rounded-xl bg-emerald-900 px-4 py-3 text-left text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            Merge both lists
            <span className="mt-1 block text-xs font-normal text-emerald-100">
              Keep every stop marked in either place.
            </span>
          </button>
          <button
            type="button"
            disabled={isResolving}
            onClick={() => onResolve('keep-local')}
            className="rounded-xl border border-stone-300 px-4 py-3 text-left text-sm font-semibold text-stone-900 hover:bg-stone-50 disabled:opacity-60"
          >
            Keep guest progress
            <span className="mt-1 block text-xs font-normal text-stone-600">
              Replace the account checklist with this browser's list.
            </span>
          </button>
          <button
            type="button"
            disabled={isResolving}
            onClick={() => onResolve('keep-cloud')}
            className="rounded-xl border border-stone-300 px-4 py-3 text-left text-sm font-semibold text-stone-900 hover:bg-stone-50 disabled:opacity-60"
          >
            Keep account progress
            <span className="mt-1 block text-xs font-normal text-stone-600">
              Use the account list and clear this browser's guest list after
              confirmation.
            </span>
          </button>
        </div>
      </section>
    </div>
  )
}
