import { ArrowDown, Compass, MapPin, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HomePage() {
  return (
    <section className="mx-auto grid min-h-[calc(100svh-9.5rem)] max-w-6xl items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:py-20">
      <div className="max-w-2xl">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/70 px-3.5 py-2 text-sm text-emerald-950 shadow-sm shadow-stone-900/5">
          <Sparkles aria-hidden="true" size={15} />
          Your next favorite place is out there
        </div>
        <h1 className="text-5xl leading-[1.06] font-semibold tracking-[-0.055em] text-stone-950 sm:text-6xl lg:text-7xl">
          Make room for{' '}
          <span className="font-serif font-normal text-emerald-900 italic">
            wonder.
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-stone-600 sm:text-xl">
          Keep a simple list of the places you want to see, and enjoy every
          little discovery along the way.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Button
            size="lg"
            onClick={() =>
              document
                .getElementById('getting-started')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            <Compass aria-hidden="true" />
            Start exploring
          </Button>
          <span className="text-sm text-stone-500">
            A calmer way to plan a city break
          </span>
        </div>
      </div>
      <div
        className="relative mx-auto w-full max-w-md lg:max-w-none"
        aria-label="A preview of a city travel list"
      >
        <div className="absolute -inset-5 rounded-[2.5rem] bg-emerald-900/5 blur-2xl" />
        <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-[#e7e9df] p-5 shadow-xl shadow-stone-900/10 sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_15%,rgba(255,255,255,0.8),transparent_38%),linear-gradient(145deg,transparent_40%,rgba(38,75,57,0.14))]" />
          <div className="relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#a9b7a2] via-[#d8d3bd] to-[#849789] p-6 sm:p-8">
            <div className="absolute top-8 -right-8 size-48 rounded-full border-[22px] border-white/20 sm:size-60" />
            <div className="absolute -bottom-20 -left-5 h-48 w-[120%] rotate-[-8deg] rounded-[50%] bg-emerald-950/20" />
            <span className="relative inline-flex w-fit items-center gap-1.5 rounded-full bg-white/75 px-3 py-1.5 text-xs font-medium text-emerald-950 backdrop-blur">
              <MapPin aria-hidden="true" size={13} />
              Your next city
            </span>
            <div className="relative">
              <p className="text-sm text-white/85">
                A collection of little moments
              </p>
              <p className="mt-1 font-serif text-4xl text-white sm:text-5xl">
                Somewhere new
              </p>
            </div>
          </div>
          <div className="relative flex items-center justify-between px-1 pt-5">
            <div>
              <p className="font-medium text-stone-900">Your travel list</p>
              <p className="mt-1 text-sm text-stone-500">
                A few good places to begin
              </p>
            </div>
            <div className="flex -space-x-2" aria-hidden="true">
              <span className="size-8 rounded-full border-2 border-[#e7e9df] bg-[#d4aa79]" />
              <span className="size-8 rounded-full border-2 border-[#e7e9df] bg-[#809a82]" />
              <span className="flex size-8 items-center justify-center rounded-full border-2 border-[#e7e9df] bg-white text-xs text-stone-500">
                +3
              </span>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-5 -left-2 flex items-center gap-3 rounded-2xl border border-stone-100 bg-white px-4 py-3 shadow-lg shadow-stone-900/10 sm:-left-8">
          <span className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <Compass aria-hidden="true" size={18} />
          </span>
          <span>
            <span className="block text-sm font-medium">
              Take the scenic route
            </span>
            <span className="block text-xs text-stone-500">
              Good things are around the corner
            </span>
          </span>
        </div>
      </div>
      <div
        id="getting-started"
        className="col-span-full mt-2 flex items-center justify-center gap-2 text-sm text-stone-500"
      >
        <ArrowDown aria-hidden="true" size={15} />
        Your city guides are coming soon
      </div>
    </section>
  )
}
