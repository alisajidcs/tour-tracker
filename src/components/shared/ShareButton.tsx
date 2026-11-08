import { useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'

type ShareButtonProps = {
  title: string
  text: string
}

export function ShareButton({ title, text }: ShareButtonProps) {
  const [status, setStatus] = useState('')

  async function sharePage() {
    const url = window.location.href
    const shareData = { title, text, url }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        setStatus('Share sheet opened.')
        return
      }
      await navigator.clipboard.writeText(url)
      setStatus('Link copied.')
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      try {
        await navigator.clipboard.writeText(url)
        setStatus('Link copied.')
      } catch {
        setStatus(
          'Could not share this link. Copy the address from your browser.',
        )
      }
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => void sharePage()}
        className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-emerald-900/30 hover:text-emerald-900 focus-visible:ring-2 focus-visible:ring-emerald-800 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {status === 'Link copied.' ? (
          <Check aria-hidden="true" size={16} />
        ) : status === 'Share sheet opened.' ? (
          <Share2 aria-hidden="true" size={16} />
        ) : (
          <Copy aria-hidden="true" size={16} />
        )}
        Share
      </button>
      <span role="status" className="text-xs text-stone-500">
        {status}
      </span>
    </div>
  )
}
