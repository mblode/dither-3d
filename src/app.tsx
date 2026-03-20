import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { CameraControls } from "./components/camera-controls";
import Effects from "./components/effects";
import { GameControls } from "./components/game-controls";
import { UI } from "./components/ui";
import type { DisplayMode } from "./game";
import { GameProvider, INITIAL_CAMERA_POSITION } from "./game";
import Scene from "./scene";

// Internal rendering resolution (matches Obra Dinn's setup)
const INTERNAL_WIDTH = 800;

function GameCanvas() {
  // Auto-select display mode:
  // - Mobile: always ANALOG (effectively fullscreen, softened output reduces discomfort)
  // - Desktop fullscreen: ANALOG (sphere-mapped dither, softened output)
  // - Desktop windowed: DIGITAL (border-boxed, screenspace offset dither, 1-bit output)
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isMobile) {
      return "ANALOG";
    }
    return document.fullscreenElement ? "ANALOG" : "DIGITAL";
  });

  useEffect(() => {
    const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isMobile) {
      return;
    }

    const onFullscreenChange = () => {
      setDisplayMode(document.fullscreenElement ? "ANALOG" : "DIGITAL");
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Compute dpr to achieve ~800px wide internal rendering resolution
  // This preserves the low-res pixelated style at any screen size
  const [renderDpr, setRenderDpr] = useState(1);

  useEffect(() => {
    const updateDpr = () => {
      const dpr = Math.min(1, INTERNAL_WIDTH / window.innerWidth);
      setRenderDpr(dpr);
    };
    updateDpr();
    window.addEventListener("resize", updateDpr);
    return () => window.removeEventListener("resize", updateDpr);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#000000",
      }}
    >
      <Canvas
        camera={{
          position: INITIAL_CAMERA_POSITION,
          fov: 75,
          near: 0.1,
          far: 500,
        }}
        dpr={renderDpr}
      >
        {/* Multi-directional lighting for maximum asteroid visibility */}
        <ambientLight intensity={1.0} />

        {/* Main sun - from upper back */}
        <directionalLight
          castShadow
          intensity={1.5}
          position={[100, 200, -300]}
        />

        {/* Fill lights from multiple angles */}
        <directionalLight intensity={1.2} position={[-100, 100, 200]} />
        <directionalLight intensity={1.0} position={[100, -100, 100]} />
        <directionalLight intensity={1.0} position={[0, 100, 300]} />
        <directionalLight intensity={0.8} position={[-150, 0, -100]} />

        {/* Scene with dynamic asteroids */}
        <Scene />

        {/* Camera controls (desktop + mobile) */}
        <CameraControls />

        {/* Game controls */}
        <GameControls />

        {/* Post-processing with dither effect */}
        <Effects
          displayMode={displayMode}
          patternScale={12.0}
          threshold={0.5}
        />
      </Canvas>
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <UI />
      <GameCanvas />
    </GameProvider>
  );
}
