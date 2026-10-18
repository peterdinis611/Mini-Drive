import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import type { Mesh } from 'three'

type Props = {
  /** 0–1 fill amount */
  fill?: number
  className?: string
}

function useThemeColors() {
  return useMemo(() => {
    if (typeof document === 'undefined') {
      return { accent: '#2383e2', mist: '#e7f3ff', ink: '#37352f' }
    }
    const dark = document.documentElement.classList.contains('dark')
    return dark
      ? { accent: '#529cca', mist: '#1f2e3d', ink: '#ffffff' }
      : { accent: '#2383e2', mist: '#e7f3ff', ink: '#37352f' }
  }, [])
}

function Orb({ fill }: { fill: number }) {
  const colors = useThemeColors()
  const core = useRef<Mesh>(null)
  const ring = useRef<Mesh>(null)
  const clamped = Math.min(1, Math.max(0.08, fill))

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (core.current) {
      core.current.rotation.y = t * 0.35
      core.current.rotation.x = Math.sin(t * 0.4) * 0.15
    }
    if (ring.current) {
      ring.current.rotation.z = t * 0.5
      ring.current.rotation.x = Math.PI / 2.4 + Math.sin(t * 0.3) * 0.1
    }
  })

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 2]} intensity={1.1} />
      <pointLight position={[-2, 1, 2]} intensity={0.5} color={colors.accent} />
      <Float speed={1.3} floatIntensity={0.4} rotationIntensity={0.12}>
        <mesh ref={core} scale={0.55 + clamped * 0.35}>
          <icosahedronGeometry args={[0.7, 1]} />
          <meshStandardMaterial
            color={colors.accent}
            roughness={0.25}
            metalness={0.28}
            flatShading
          />
        </mesh>
        <mesh ref={ring} scale={1.15}>
          <torusGeometry args={[0.85, 0.035, 12, 64]} />
          <meshStandardMaterial
            color={colors.mist}
            roughness={0.35}
            metalness={0.2}
          />
        </mesh>
        <mesh position={[0.55, 0.4, 0.3]} scale={0.12}>
          <boxGeometry args={[1, 1.3, 0.15]} />
          <meshStandardMaterial color={colors.ink} roughness={0.4} />
        </mesh>
        <mesh position={[-0.5, -0.35, 0.25]} scale={0.1}>
          <boxGeometry args={[1.2, 1, 0.15]} />
          <meshStandardMaterial color={colors.mist} roughness={0.45} />
        </mesh>
      </Float>
    </>
  )
}

export function StorageOrb({ fill = 0, className }: Props) {
  return (
    <div className={className} aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.1, 3.4], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        style={{ width: '100%', height: '100%' }}
      >
        <Orb fill={fill} />
      </Canvas>
    </div>
  )
}
