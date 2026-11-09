import { useEffect, useId, useRef, type PropsWithChildren } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export function Dialog({
  title,
  onClose,
  busy = false,
  children,
}: PropsWithChildren<{ title: string; onClose: () => void; busy?: boolean }>) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const dialog = ref.current!
    if (dialog.showModal) dialog.showModal()
    else dialog.setAttribute('open', '')
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      dialog.close?.()
      previous?.focus()
    }
  }, [])
  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
      className="editor-dialog"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-stone-200 bg-white px-6 py-5">
        <h2 id={titleId} className="text-xl font-semibold tracking-tight">
          {title}
        </h2>
        <button
          type="button"
          aria-label="Close dialog"
          disabled={busy}
          onClick={onClose}
          className="rounded-full p-2 text-stone-500 hover:bg-stone-100 disabled:opacity-40"
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>,
    document.body,
  )
}
