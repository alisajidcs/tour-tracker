import { useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

let checklistPosition:
  { routeKey: string; placeId: string; scrollY: number } | undefined

export function rememberChecklistPosition(routeKey: string, placeId: string) {
  checklistPosition = { routeKey, placeId, scrollY: window.scrollY }
}

export function useRestoreChecklistPosition(ready: boolean) {
  const { hash, key } = useLocation()
  const navigationType = useNavigationType()

  useLayoutEffect(() => {
    if (!ready) return
    const popPosition =
      navigationType === 'POP' && checklistPosition?.routeKey === key
        ? checklistPosition
        : undefined
    const placeId =
      popPosition?.placeId ??
      (hash.startsWith('#place-') ? hash.slice(1) : undefined)
    if (!placeId) return

    const link = document.getElementById(`${placeId}-link`)
    if (!link) return
    link.focus({ preventScroll: true })
    if (popPosition?.placeId === placeId) {
      const frame = window.requestAnimationFrame(() => {
        const bounds = link.getBoundingClientRect()
        const linkTop = bounds.top + window.scrollY
        const linkBottom = bounds.bottom + window.scrollY
        if (
          linkBottom > popPosition.scrollY &&
          linkTop < popPosition.scrollY + window.innerHeight
        ) {
          window.scrollTo({ top: popPosition.scrollY, behavior: 'instant' })
        } else {
          link.scrollIntoView({ block: 'start', behavior: 'instant' })
        }
      })
      return () => window.cancelAnimationFrame(frame)
    } else {
      document
        .getElementById(placeId)
        ?.scrollIntoView({ block: 'start', behavior: 'instant' })
    }
  }, [hash, key, navigationType, ready])
}
