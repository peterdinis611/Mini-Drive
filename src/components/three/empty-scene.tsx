import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import type { Group, Mesh } from 'three'

export type EmptySceneKind = 'files' | 'shares'

type Props = {
  kind: EmptySceneKind
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

function FilesScene() {
  const colors = useThemeColors()
  const folder = useRef<Group>(null)

  useFrame((state) => {
    if (!folder.current) return
    const t = state.clock.elapsedTime
    folder.current.rotation.y = Math.sin(t * 0.4) * 0.35
    folder.current.rotation.x = Math.sin(t * 0.25) * 0.08
  })

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 2]} intensity={1.05} />
      <pointLight position={[-2, 1, 1]} intensity={0.4} color={colors.accent} />
      <group ref={folder}>
        <Float speed={1.4} floatIntensity={0.45} rotationIntensity={0.15}>
          {/* folder body */}
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[1.35, 0.85, 0.22]} />
            <meshStandardMaterial
              color={colors.accent}
              roughness={0.4}
              metalness={0.12}
            />
          </mesh>
          {/* tab */}
          <mesh position={[-0.28, 0.48, 0]}>
            <boxGeometry args={[0.55, 0.22, 0.18]} />
            <meshStandardMaterial
              color={colors.mist}
              roughness={0.45}
              metalness={0.08}
            />
          </mesh>
          {/* paper sheets peeking out */}
          {[0.08, 0.16, 0.24].map((y, i) => (
            <mesh key={i} position={[0.05, y, 0.08 + i * 0.02]} rotation={[0.08, 0, 0.02 * i]}>
              <boxGeometry args={[1.05, 0.04, 0.9]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? '#f7f6f3' : colors.mist}
                roughness={0.7}
              />
            </mesh>
          ))}
        </Float>
      </group>
    </>
  )
}

function LinkRing({
  position,
  color,
  speed,
}: {
  position: [number, number, number]
  color: string
  speed: number
}) {
  const ref = useRef<Mesh>(null)
  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.x = state.clock.elapsedTime * speed
    ref.current.rotation.y = state.clock.elapsedTime * speed * 0.6
  })
  return (
    <mesh ref={ref} position={position}>
      <torusGeometry args={[0.38, 0.08, 16, 48]} />
      <meshStandardMaterial
        color={color}
        roughness={0.3}
        metalness={0.35}
      />
    </mesh>
  )
}

function SharesScene() {
  const colors = useThemeColors()

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[2, 3, 2]} intensity={1.1} />
      <pointLight position={[-2, 0, 2]} intensity={0.45} color={colors.accent} />
      <Float speed={1.2} floatIntensity={0.35} rotationIntensity={0.2}>
        <LinkRing position={[-0.35, 0.15, 0]} color={colors.accent} speed={0.55} />
        <LinkRing position={[0.35, -0.1, 0.1]} color={colors.ink} speed={-0.4} />
        <mesh position={[0, 0, -0.35]}>
          <sphereGeometry args={[0.12, 24, 24]} />
          <meshStandardMaterial color={colors.mist} roughness={0.35} metalness={0.2} />
        </mesh>
      </Float>
    </>
  )
}

export function EmptyScene({ kind, className }: Props) {
  return (
    <div className={className} aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.15, 3.2], fov: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        style={{ width: '100%', height: '100%' }}
      >
        {kind === 'files' ? <FilesScene /> : <SharesScene />}
      </Canvas>
    </div>
  )
}
