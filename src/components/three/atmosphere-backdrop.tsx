import { lazy, Suspense, useEffect, useState } from 'react'
import { useReducedMotion } from 'motion/react'

import { supportsWebGL } from '#/lib/webgl'
import { cn } from '#/lib/utils'

const OrbitField = lazy(() =>
  import('#/components/three/orbit-field').then((mod) => ({
    default: mod.OrbitField,
  })),
)

type Props = {
  intensity?: 'soft' | 'bold'
  className?: string
}

/** Client-only Three.js atmosphere with CSS fallback. */
export function AtmosphereBackdrop({
  intensity = 'soft',
  className,
}: Props) {
  const reduce = useReducedMotion()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const webglOk = mounted && !reduce && supportsWebGL()

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
      aria-hidden
    >
      <div className="status-page-mesh absolute inset-0" />
      <div className="status-page-grain absolute inset-0" />
      {webglOk ? (
        <Suspense fallback={null}>
          <OrbitField
            intensity={intensity}
            className="absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_70%_60%_at_70%_40%,black,transparent_78%)]"
          />
        </Suspense>
      ) : null}
    </div>
  )
}
