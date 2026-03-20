import { EffectComposer } from "@react-three/postprocessing";
import type { DisplayMode } from "../game";
import DitherEffect from "./dither-effect";

interface EffectsProps {
  patternScale: number;
  threshold: number;
  pixelSize?: number;
  displayMode?: DisplayMode;
}

export default function Effects({
  patternScale,
  threshold,
  pixelSize = 1.0,
  displayMode = "ANALOG",
}: EffectsProps) {
  return (
    <EffectComposer>
      <DitherEffect
        displayMode={displayMode}
        patternScale={patternScale}
        pixelSize={pixelSize}
        threshold={threshold}
      />
    </EffectComposer>
  );
}
