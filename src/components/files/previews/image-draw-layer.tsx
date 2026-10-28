import { useRef } from 'react'

import type { DrawStroke } from '#/lib/crop-image'
import { cn } from '#/lib/utils'

type Props = {
  enabled: boolean
  color: string
  widthNorm: number
  strokes: DrawStroke[]
  onChange: (strokes: DrawStroke[]) => void
  /** When parent is CSS-flipped, map visual → natural image coords. */
  flipHorizontal?: boolean
  flipVertical?: boolean
  className?: string
}

function pointerToNorm(
  event: React.PointerEvent<SVGSVGElement>,
  flipHorizontal: boolean,
  flipVertical: boolean,
): { x: number; y: number } | null {
  const rect = event.currentTarget.getBoundingClientRect()
  if (rect.width < 1 || rect.height < 1) return null
  let x = (event.clientX - rect.left) / rect.width
  let y = (event.clientY - rect.top) / rect.height
  if (flipHorizontal) x = 1 - x
  if (flipVertical) y = 1 - y
  return {
    x: Math.min(1, Math.max(0, x)),
    y: Math.min(1, Math.max(0, y)),
  }
}

/** SVG overlay for freehand annotations in normalized image coords. */
export function ImageDrawLayer({
  enabled,
  color,
  widthNorm,
  strokes,
  onChange,
  flipHorizontal = false,
  flipVertical = false,
  className,
}: Props) {
  const strokesRef = useRef(strokes)
  strokesRef.current = strokes
  const drawingRef = useRef(false)

  return (
    <svg
      className={cn(
        'absolute inset-0 h-full w-full touch-none',
        enabled ? 'cursor-crosshair' : 'pointer-events-none',
        className,
      )}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      onPointerDown={(event) => {
        if (!enabled) return
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        const point = pointerToNorm(event, flipHorizontal, flipVertical)
        if (!point) return
        drawingRef.current = true
        const stroke: DrawStroke = {
          color,
          width: 2,
          widthNorm,
          points: [point],
        }
        onChange([...strokesRef.current, stroke])
      }}
      onPointerMove={(event) => {
        if (!enabled || !drawingRef.current) return
        const point = pointerToNorm(event, flipHorizontal, flipVertical)
        if (!point) return
        const current = strokesRef.current
        const last = current[current.length - 1]
        if (!last) return
        onChange([
          ...current.slice(0, -1),
          { ...last, points: [...last.points, point] },
        ])
      }}
      onPointerUp={() => {
        drawingRef.current = false
      }}
      onPointerCancel={() => {
        drawingRef.current = false
      }}
    >
      {strokes.map((stroke, index) => {
        if (stroke.points.length < 2) return null
        // Stored in natural coords; parent CSS flip/rotate mirrors the SVG.
        const d = stroke.points
          .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`)
          .join(' ')
        return (
          <path
            key={index}
            d={d}
            fill="none"
            stroke={stroke.color}
            strokeWidth={stroke.widthNorm ?? 0.008}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )
      })}
    </svg>
  )
}
