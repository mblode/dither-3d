import { Canvas } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import Scene from "./Scene";
import Effects from "./components/Effects";
import { GameProvider, INITIAL_CAMERA_POSITION } from "./Game";
import { GameControls } from "./components/GameControls";
import { UI } from "./components/UI";

export default function App() {
  return (
    <GameProvider>
      <UI />
      <Canvas
        camera={{
          position: INITIAL_CAMERA_POSITION,
          fov: 75,
          near: 0.1,
          far: 500,
        }}
        dpr={[1, 2]}
      >
        {/* Multi-directional lighting for maximum asteroid visibility */}
        <ambientLight intensity={1.0} />

        {/* Main sun - from upper back */}
        <directionalLight
          position={[100, 200, -300]}
          intensity={1.5}
          castShadow
        />

        {/* Fill lights from multiple angles */}
        <directionalLight position={[-100, 100, 200]} intensity={1.2} />
        <directionalLight position={[100, -100, 100]} intensity={1.0} />
        <directionalLight position={[0, 100, 300]} intensity={1.0} />
        <directionalLight position={[-150, 0, -100]} intensity={0.8} />

        {/* Scene with dynamic asteroids */}
        <Scene />

        {/* Mouse look controls */}
        <PointerLockControls />

        {/* Game controls */}
        <GameControls />

        {/* Post-processing with dither effect */}
        <Effects sphereRadius={10.0} patternScale={10.0} threshold={0.5} />
      </Canvas>
    </GameProvider>
  );
}
