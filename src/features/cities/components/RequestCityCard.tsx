import { Dialog } from '@/components/ui/dialog'
import { useState, type FormEvent } from 'react'
import { ArrowRight, LoaderCircle, MapPinPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/AuthContext'
import { submitCityRequest } from '@/features/cities/api'

export function RequestCityCard() {
  const auth = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [cityName, setCityName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = cityName.trim()
    if (!trimmedName || !auth.user) return

    setIsSubmitting(true)
    setError(null)
    try {
      await submitCityRequest(trimmedName)
      setCityName('')
      setSuccess(true)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Your request could not be sent. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="border-guide-line mt-8 border-y py-5 sm:mt-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="bg-guide-soft text-guide-accent grid size-11 shrink-0 place-items-center rounded-lg">
            <MapPinPlus aria-hidden="true" size={20} />
          </span>
          <div>
            <h2 className="guide-display text-2xl">Missing a city?</h2>
            <p className="text-guide-muted mt-1 max-w-xl text-sm leading-6">
              Suggest somewhere you’d love to see in Tour Tracker.
            </p>
          </div>
        </div>
        {!isOpen ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(true)}
            className="guide-control shrink-0 self-start sm:self-auto"
          >
            Request a city <ArrowRight aria-hidden="true" size={16} />
          </Button>
        ) : null}
      </div>

      {isOpen ? (
        <Dialog
          title="Request a city"
          busy={isSubmitting}
          onClose={() => setIsOpen(false)}
        >
          {auth.user ? (
            success ? (
              <p role="status" className="text-sm font-medium text-emerald-900">
                Thanks — your city suggestion is with the admin now.
              </p>
            ) : (
              <form
                onSubmit={(event) => void submitRequest(event)}
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <label className="flex-1 text-sm font-medium text-stone-800">
                  City name
                  <input
                    required
                    maxLength={100}
                    value={cityName}
                    onChange={(event) => setCityName(event.currentTarget.value)}
                    placeholder="e.g. Kyoto"
                    className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-base font-normal transition outline-none placeholder:text-stone-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15"
                  />
                </label>
                <Button
                  type="submit"
                  disabled={isSubmitting || !cityName.trim()}
                  className="shrink-0"
                >
                  {isSubmitting ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="animate-spin"
                      size={16}
                    />
                  ) : null}
                  {isSubmitting ? 'Sending…' : 'Send suggestion'}
                </Button>
              </form>
            )
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-stone-700">
                Sign in to send a city suggestion. Anyone can browse the guides;
                requests are linked to your account.
              </p>
              <Button
                type="button"
                onClick={() => void auth.signInWithGoogle()}
                className="shrink-0 self-start sm:self-auto"
              >
                Sign in to request
              </Button>
            </div>
          )}
          {error ? (
            <p role="alert" className="mt-3 text-sm text-red-800">
              {error}
            </p>
          ) : null}
        </Dialog>
      ) : null}
    </section>
  )
}
