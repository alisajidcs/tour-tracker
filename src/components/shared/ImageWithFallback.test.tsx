import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ImageWithFallback } from './ImageWithFallback'

describe('ImageWithFallback', () => {
  it('tries a new image source after the previous source failed', () => {
    const { rerender } = render(
      <ImageWithFallback
        src="https://example.com/old.jpg"
        alt="Old city view"
      />,
    )

    fireEvent.error(screen.getByRole('img', { name: 'Old city view' }))
    expect(
      screen.getByRole('img', { name: 'Old city view image unavailable' }),
    ).toBeInTheDocument()

    rerender(
      <ImageWithFallback
        src="https://example.com/new.jpg"
        alt="New city view"
      />,
    )

    expect(screen.getByRole('img', { name: 'New city view' })).toHaveAttribute(
      'src',
      'https://example.com/new.jpg',
    )
  })
})
