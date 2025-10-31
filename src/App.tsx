import { Canvas } from '@react-three/fiber'
import { OrbitControls, PointerLockControls } from '@react-three/drei'
import { useControls } from 'leva'
import Scene from './Scene'
import Effects from './components/Effects'
import KeyboardControls from './components/KeyboardControls'

export default function App() {
  const { sphereRadius, patternScale, threshold, flyMode } = useControls({
    flyMode: {
      value: false,
      label: 'Fly Mode'
    },
    sphereRadius: {
      value: 10.0,
      min: 1.0,
      max: 50.0,
      step: 0.5,
      label: 'Camera Sphere Radius'
    },
    patternScale: {
      value: 10.0,
      min: 1.0,
      max: 100.0,
      step: 1.0,
      label: 'Pattern Scale'
    },
    threshold: {
      value: 0.5,
      min: 0.0,
      max: 1.0,
      step: 0.01,
      label: 'Threshold Bias'
    }
  })

  return (
    <Canvas
      camera={{
        position: [0, 0, 10],
        fov: 75,
        near: 0.1,
        far: 500
      }}
      dpr={[1, 2]}
    >
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />

      {/* Scene with test objects */}
      <Scene />

      {/* Camera controls - switch between orbit and fly */}
      {flyMode ? (
        <>
          <PointerLockControls />
          <KeyboardControls />
        </>
      ) : (
        <OrbitControls makeDefault />
      )}

      {/* Post-processing with dither effect */}
      <Effects
        sphereRadius={sphereRadius}
        patternScale={patternScale}
        threshold={threshold}
      />
    </Canvas>
  )
}
