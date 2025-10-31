import { EffectComposer, Pixelation } from '@react-three/postprocessing'
import DitherEffect from './DitherEffect'

interface EffectsProps {
  sphereRadius: number
  patternScale: number
  threshold: number
  pixelationEnabled: boolean
  pixelSize: number
}

export default function Effects({
  sphereRadius,
  patternScale,
  threshold,
  pixelationEnabled,
  pixelSize
}: EffectsProps) {
  return (
    <EffectComposer>
      {pixelationEnabled && <Pixelation granularity={pixelSize} />}
      <DitherEffect
        sphereRadius={sphereRadius}
        patternScale={patternScale}
        threshold={threshold}
      />
    </EffectComposer>
  )
}
