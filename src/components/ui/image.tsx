'use client'

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type ImgHTMLAttributes,
  type SyntheticEvent,
} from 'react'

import { cn } from '#/lib/utils'

type ObjectFit = NonNullable<CSSProperties['objectFit']>

export type ImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'alt' | 'width' | 'height' | 'loading' | 'sizes'
> & {
  src: string
  alt: string
  /** Intrinsic width — required unless `fill` is set. */
  width?: number | `${number}`
  /** Intrinsic height — required unless `fill` is set. */
  height?: number | `${number}`
  /**
   * Stretch to the nearest `position: relative` parent (like next/image).
   * Parent should define size; this image becomes absolutely positioned.
   */
  fill?: boolean
  sizes?: string
  /** Eager load + high fetch priority (above the fold). */
  priority?: boolean
  loading?: 'lazy' | 'eager'
  placeholder?: 'blur' | 'empty'
  /** Base64 / data URL used while loading when `placeholder="blur"`. */
  blurDataURL?: string
  /**
   * Kept for next/image API parity. Without an image optimizer this is a no-op;
   * prefer `true` for signed CDN URLs, SVG, and already-optimized assets.
   */
  unoptimized?: boolean
  /** Kept for next/image API parity — unused without a resize CDN. */
  quality?: number
  objectFit?: ObjectFit
  objectPosition?: string
}

function toNumber(value: number | `${number}` | undefined) {
  if (value == null) return undefined
  return typeof value === 'number' ? value : Number(value)
}

/**
 * Drop-in inspired by `next/image` for Vite / TanStack Start.
 * Handles layout (`width`/`height` or `fill`), lazy/priority loading,
 * and optional blur placeholder — without requiring an image CDN.
 */
export function Image({
  src,
  alt,
  width,
  height,
  fill = false,
  sizes,
  priority = false,
  loading,
  placeholder = 'empty',
  blurDataURL,
  unoptimized: _unoptimized = true,
  quality: _quality,
  objectFit,
  objectPosition,
  className,
  style,
  onLoad,
  onError,
  decoding = 'async',
  referrerPolicy = 'no-referrer',
  fetchPriority,
  ...rest
}: ImageProps) {
  const w = toNumber(width)
  const h = toNumber(height)

  if (process.env.NODE_ENV !== 'production') {
    if (!fill && (w == null || h == null)) {
      console.warn(
        '[Image] Provide both `width` and `height`, or set `fill`. Missing dimensions cause layout shift.',
      )
    }
    if (fill && (w != null || h != null)) {
      console.warn(
        '[Image] `fill` images should not set `width` / `height` — size comes from the parent.',
      )
    }
    if (placeholder === 'blur' && !blurDataURL) {
      console.warn(
        '[Image] `placeholder="blur"` needs a `blurDataURL` (tiny base64 preview).',
      )
    }
  }

  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setLoaded(false)
    setFailed(false)
  }, [src])

  const handleLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      setLoaded(true)
      onLoad?.(event)
    },
    [onLoad],
  )

  const handleError = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      setFailed(true)
      onError?.(event)
    },
    [onError],
  )

  const resolvedLoading = priority ? 'eager' : (loading ?? 'lazy')
  const useBlur = placeholder === 'blur' && Boolean(blurDataURL)
  const showBlur = useBlur && !loaded && !failed
  const sized = fill || (w != null && h != null)

  const imgStyle: CSSProperties = {
    objectFit: objectFit ?? (fill ? 'cover' : undefined),
    objectPosition,
    ...style,
  }

  if (showBlur) {
    imgStyle.backgroundImage = `url("${blurDataURL}")`
    imgStyle.backgroundSize =
      (objectFit ?? (fill ? 'cover' : 'cover')) === 'contain' ? 'contain' : 'cover'
    imgStyle.backgroundPosition = objectPosition ?? 'center'
    imgStyle.backgroundRepeat = 'no-repeat'
  }

  const img = (
    <img
      {...rest}
      src={src}
      alt={alt}
      width={fill ? undefined : w}
      height={fill ? undefined : h}
      sizes={sizes}
      loading={resolvedLoading}
      decoding={decoding}
      referrerPolicy={referrerPolicy}
      fetchPriority={priority ? 'high' : fetchPriority}
      className={cn(
        sized && 'absolute inset-0 size-full max-w-none',
        useBlur && 'transition-[filter,transform,opacity] duration-300 ease-out',
        showBlur && 'scale-105 blur-sm',
        useBlur && loaded && 'scale-100 blur-0',
        failed && 'opacity-0',
        className,
      )}
      style={imgStyle}
      onLoad={handleLoad}
      onError={handleError}
    />
  )

  if (fill) {
    return (
      <span data-slot="image-fill" className="absolute inset-0 block overflow-hidden">
        {img}
      </span>
    )
  }

  if (w != null && h != null) {
    return (
      <span
        data-slot="image"
        className="relative inline-block max-w-full overflow-hidden leading-none align-middle"
        style={{
          width: '100%',
          maxWidth: w,
          aspectRatio: `${w} / ${h}`,
        }}
      >
        {img}
      </span>
    )
  }

  return img
}

/** Tiny neutral gray SVG — usable as a default `blurDataURL`. */
export const DEFAULT_BLUR_DATA_URL =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="#d4d4d8"/></svg>`,
  )
