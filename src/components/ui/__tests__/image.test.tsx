import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_BLUR_DATA_URL, Image } from '#/components/ui/image'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Image', () => {
  it('renders sized image with width/height wrapper and aspect-ratio', () => {
    const { container } = render(
      <Image src="/a.png" alt="Demo" width={120} height={80} />,
    )
    const img = screen.getByRole('img', { name: 'Demo' })
    expect(img).toHaveAttribute('src', '/a.png')
    expect(img).toHaveAttribute('width', '120')
    expect(img).toHaveAttribute('height', '80')
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('decoding', 'async')
    expect(img).toHaveAttribute('referrerPolicy', 'no-referrer')

    const wrapper = container.querySelector('[data-slot="image"]')
    expect(wrapper).toBeTruthy()
    expect(wrapper).toHaveStyle({
      maxWidth: '120px',
      aspectRatio: '120 / 80',
    })
  })

  it('accepts string width/height like next/image', () => {
    render(<Image src="/s.png" alt="String dims" width="64" height="32" />)
    const img = screen.getByRole('img', { name: 'String dims' })
    expect(img).toHaveAttribute('width', '64')
    expect(img).toHaveAttribute('height', '32')
  })

  it('uses priority → eager + high fetchPriority', () => {
    render(
      <Image src="/hero.png" alt="Hero" width={800} height={400} priority />,
    )
    const img = screen.getByRole('img', { name: 'Hero' })
    expect(img).toHaveAttribute('loading', 'eager')
    expect(img).toHaveAttribute('fetchpriority', 'high')
  })

  it('respects explicit loading when priority is off', () => {
    render(
      <Image src="/e.png" alt="Eager" width={10} height={10} loading="eager" />,
    )
    expect(screen.getByRole('img', { name: 'Eager' })).toHaveAttribute(
      'loading',
      'eager',
    )
  })

  it('priority overrides loading=lazy', () => {
    render(
      <Image
        src="/p.png"
        alt="Priority"
        width={10}
        height={10}
        priority
        loading="lazy"
      />,
    )
    expect(screen.getByRole('img', { name: 'Priority' })).toHaveAttribute(
      'loading',
      'eager',
    )
  })

  it('fill mode mounts absolute image and defaults object-fit cover', () => {
    const { container } = render(
      <div className="relative size-40">
        <Image src="/fill.png" alt="Fill" fill />
      </div>,
    )
    expect(container.querySelector('[data-slot="image-fill"]')).toBeTruthy()
    const img = screen.getByRole('img', { name: 'Fill' })
    expect(img.className).toContain('absolute')
    expect(img).not.toHaveAttribute('width')
    expect(img).not.toHaveAttribute('height')
    expect(img.style.objectFit).toBe('cover')
  })

  it('applies objectFit / objectPosition / sizes / className', () => {
    render(
      <Image
        src="/o.png"
        alt="Fit"
        width={200}
        height={100}
        sizes="(max-width: 600px) 100vw, 200px"
        objectFit="contain"
        objectPosition="top left"
        className="rounded-md ring-1"
      />,
    )
    const img = screen.getByRole('img', { name: 'Fit' })
    expect(img).toHaveAttribute('sizes', '(max-width: 600px) 100vw, 200px')
    expect(img.style.objectFit).toBe('contain')
    expect(img.style.objectPosition).toBe('top left')
    expect(img.className).toContain('rounded-md')
    expect(img.className).toContain('ring-1')
  })

  it('merges custom style over objectFit defaults', () => {
    render(
      <div className="relative size-20">
        <Image src="/style.png" alt="Styled" fill style={{ opacity: 0.5 }} />
      </div>,
    )
    const img = screen.getByRole('img', { name: 'Styled' })
    expect(img.style.opacity).toBe('0.5')
    expect(img.style.objectFit).toBe('cover')
  })

  it('shows blur placeholder styles until load, then clears blur', () => {
    render(
      <Image
        src="/blur.png"
        alt="Blurry"
        width={40}
        height={40}
        placeholder="blur"
        blurDataURL={DEFAULT_BLUR_DATA_URL}
      />,
    )
    const img = screen.getByRole('img', { name: 'Blurry' })
    expect(img.className).toContain('blur-sm')
    expect(img.style.backgroundImage).toContain('data:image/svg+xml')

    fireEvent.load(img)
    expect(img.className).toContain('blur-0')
    expect(img.className).not.toContain('blur-sm')
  })

  it('uses contain backgroundSize when objectFit is contain + blur', () => {
    render(
      <Image
        src="/c.png"
        alt="Contain blur"
        width={40}
        height={40}
        placeholder="blur"
        blurDataURL={DEFAULT_BLUR_DATA_URL}
        objectFit="contain"
      />,
    )
    const img = screen.getByRole('img', { name: 'Contain blur' })
    expect(img.style.backgroundSize).toBe('contain')
  })

  it('calls onLoad and onError callbacks', () => {
    const onLoad = vi.fn()
    const onError = vi.fn()
    const { rerender } = render(
      <Image
        src="/ok.png"
        alt="Callbacks"
        width={20}
        height={20}
        onLoad={onLoad}
        onError={onError}
      />,
    )
    const img = screen.getByRole('img', { name: 'Callbacks' })
    fireEvent.load(img)
    expect(onLoad).toHaveBeenCalledTimes(1)

    rerender(
      <Image
        src="/bad.png"
        alt="Callbacks"
        width={20}
        height={20}
        onLoad={onLoad}
        onError={onError}
      />,
    )
    fireEvent.error(screen.getByRole('img', { name: 'Callbacks' }))
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('hides image on error via opacity-0', () => {
    render(<Image src="/x.png" alt="Fail" width={20} height={20} />)
    const img = screen.getByRole('img', { name: 'Fail' })
    fireEvent.error(img)
    expect(img.className).toContain('opacity-0')
  })

  it('resets loaded/failed state when src changes', () => {
    const { rerender } = render(
      <Image
        src="/one.png"
        alt="Swap"
        width={20}
        height={20}
        placeholder="blur"
        blurDataURL={DEFAULT_BLUR_DATA_URL}
      />,
    )
    let img = screen.getByRole('img', { name: 'Swap' })
    fireEvent.load(img)
    expect(img.className).toContain('blur-0')

    rerender(
      <Image
        src="/two.png"
        alt="Swap"
        width={20}
        height={20}
        placeholder="blur"
        blurDataURL={DEFAULT_BLUR_DATA_URL}
      />,
    )
    img = screen.getByRole('img', { name: 'Swap' })
    expect(img).toHaveAttribute('src', '/two.png')
    expect(img.className).toContain('blur-sm')
  })

  it('renders bare img when dimensions are missing (with warning)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { container } = render(<Image src="/bare.png" alt="Bare" />)
    expect(container.querySelector('[data-slot="image"]')).toBeNull()
    expect(container.querySelector('[data-slot="image-fill"]')).toBeNull()
    expect(screen.getByRole('img', { name: 'Bare' })).toBeTruthy()
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Provide both `width` and `height`'),
    )
  })

  it('warns when fill is combined with width/height', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <div className="relative size-10">
        <Image src="/f.png" alt="Both" fill width={10} height={10} />
      </div>,
    )
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('`fill` images should not set'),
    )
  })

  it('warns when blur placeholder lacks blurDataURL', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <Image
        src="/b.png"
        alt="Blur"
        width={40}
        height={40}
        placeholder="blur"
      />,
    )
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('needs a `blurDataURL`'),
    )
  })

  it('does not apply blur styles when placeholder is empty', () => {
    render(
      <Image
        src="/plain.png"
        alt="Plain"
        width={40}
        height={40}
        placeholder="empty"
        blurDataURL={DEFAULT_BLUR_DATA_URL}
      />,
    )
    const img = screen.getByRole('img', { name: 'Plain' })
    expect(img.className).not.toContain('blur-sm')
    expect(img.style.backgroundImage).toBe('')
  })

  it('forwards arbitrary img attributes', () => {
    render(
      <Image
        src="/attr.png"
        alt="Attrs"
        width={10}
        height={10}
        title="Tip"
        data-testid="drive-img"
        crossOrigin="anonymous"
      />,
    )
    const img = screen.getByTestId('drive-img')
    expect(img).toHaveAttribute('title', 'Tip')
    expect(img).toHaveAttribute('crossorigin', 'anonymous')
  })

  it('exports a default blur data URL', () => {
    expect(DEFAULT_BLUR_DATA_URL.startsWith('data:image/svg+xml')).toBe(true)
  })
})
