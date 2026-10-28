import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { FileThumbnail } from '#/components/files/file-thumbnail'

afterEach(() => {
  cleanup()
})

describe('FileThumbnail', () => {
  it('renders kind icon for non-image files', () => {
    const { container } = render(
      <FileThumbnail name="notes.txt" mimeType="text/plain" />,
    )
    expect(container.querySelector('svg')).toBeTruthy()
    expect(container.querySelector('img')).toBeNull()
  })

  it('renders Image fill preview for image mime + previewUrl', () => {
    const { container } = render(
      <FileThumbnail
        name="photo.jpg"
        mimeType="image/jpeg"
        previewUrl="https://cdn.example/photo.jpg"
        size="md"
      />,
    )
    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    expect(img).toHaveAttribute('src', 'https://cdn.example/photo.jpg')
    expect(img).toHaveAttribute('sizes', '44px')
    expect(img).toHaveAttribute('alt', '')
    expect(container.querySelector('[data-slot="image-fill"]')).toBeTruthy()
  })

  it('uses 32px sizes for sm thumbnails', () => {
    const { container } = render(
      <FileThumbnail
        name="tiny.png"
        mimeType="image/png"
        previewUrl="/tiny.png"
        size="sm"
      />,
    )
    expect(container.querySelector('img')).toHaveAttribute('sizes', '32px')
  })

  it('falls back to icon after image error', () => {
    const { container } = render(
      <FileThumbnail
        name="broken.webp"
        mimeType="image/webp"
        previewUrl="/broken.webp"
      />,
    )
    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    fireEvent.error(img!)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('resets failure when previewUrl changes', () => {
    const { container, rerender } = render(
      <FileThumbnail
        name="a.png"
        mimeType="image/png"
        previewUrl="/a.png"
      />,
    )
    fireEvent.error(container.querySelector('img')!)
    expect(container.querySelector('img')).toBeNull()

    rerender(
      <FileThumbnail
        name="a.png"
        mimeType="image/png"
        previewUrl="/a-retry.png"
      />,
    )
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      '/a-retry.png',
    )
  })

  it('does not preview images without previewUrl', () => {
    const { container } = render(
      <FileThumbnail name="no-url.png" mimeType="image/png" />,
    )
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('keeps decorative alt empty for a11y (presentation)', () => {
    const { container } = render(
      <FileThumbnail
        name="shot.png"
        mimeType="image/png"
        previewUrl="/shot.png"
      />,
    )
    expect(container.querySelector('img')).toHaveAttribute('alt', '')
    expect(screen.queryByRole('img')).toBeNull()
  })
})
