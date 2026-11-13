import { useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'

type ShareButtonProps = {
  title: string
  text: string
}

export function ShareButton({ title, text }: ShareButtonProps) {
  const [status, setStatus] = useState('')

  async function sharePage() {
    const page = new URL(window.location.href)
    page.hash = ''
    const url = page.href
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
        className="guide-control gap-2"
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
      <span role="status" className="text-guide-muted text-xs">
        {status}
      </span>
    </div>
  )
}
