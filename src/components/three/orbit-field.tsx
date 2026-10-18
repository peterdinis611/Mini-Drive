import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import type { Mesh } from 'three'

type OrbitFieldProps = {
  /** Softer / denser look variants */
  intensity?: 'soft' | 'bold'
  className?: string
}

function useThemeColors() {
  return useMemo(() => {
    if (typeof document === 'undefined') {
      return { accent: '#2383e2', ink: '#37352f', mist: '#e7f3ff' }
    }
    const dark = document.documentElement.classList.contains('dark')
    return dark
      ? { accent: '#529cca', ink: '#ffffff', mist: '#1f2e3d' }
      : { accent: '#2383e2', ink: '#37352f', mist: '#e7f3ff' }
  }, [])
}

function FileSlab({
  position,
  color,
  scale,
  speed,
}: {
  position: [number, number, number]
  color: string
  scale: [number, number, number]
  speed: number
}) {
  const ref = useRef<Mesh>(null)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime * speed
    ref.current.rotation.x = Math.sin(t * 0.35) * 0.18
    ref.current.rotation.y = t * 0.22
    ref.current.position.y = position[1] + Math.sin(t + position[0]) * 0.12
  })

  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.35}>
      <mesh ref={ref} position={position} castShadow>
        <boxGeometry args={scale} />
        <meshStandardMaterial
          color={color}
          roughness={0.35}
          metalness={0.15}
          transparent
          opacity={0.92}
        />
      </mesh>
    </Float>
  )
}

function Scene({ intensity }: { intensity: 'soft' | 'bold' }) {
  const colors = useThemeColors()
  const count = intensity === 'bold' ? 14 : 9

  const slabs = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2
      const radius = 1.5 + (i % 3) * 0.35
      return {
        id: i,
        position: [
          Math.cos(angle) * radius,
          (i % 5) * 0.22 - 0.5,
          Math.sin(angle) * radius * 0.7,
        ] as [number, number, number],
        scale: [
          0.55 + (i % 3) * 0.12,
          0.08 + (i % 2) * 0.03,
          0.7 + (i % 4) * 0.08,
        ] as [number, number, number],
        color: i % 3 === 0 ? colors.accent : i % 3 === 1 ? colors.mist : colors.ink,
        speed: 0.55 + (i % 4) * 0.12,
      }
    })
  }, [colors, count])

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 2]} intensity={1.1} />
      <pointLight position={[-3, 2, -2]} intensity={0.45} color={colors.accent} />
      {slabs.map(({ id, ...slab }) => (
        <FileSlab key={id} {...slab} />
      ))}
    </>
  )
}

export function OrbitField({
  intensity = 'soft',
  className,
}: OrbitFieldProps) {
  return (
    <div className={className} aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.6, 5.2], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene intensity={intensity} />
      </Canvas>
    </div>
  )
}
