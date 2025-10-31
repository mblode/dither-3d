import { EffectComposer } from '@react-three/postprocessing'
import DitherEffect from './DitherEffect'

interface EffectsProps {
  sphereRadius: number
  patternScale: number
  threshold: number
}

export default function Effects({
  sphereRadius,
  patternScale,
  threshold
}: EffectsProps) {
  return (
    <EffectComposer>
      <DitherEffect
        sphereRadius={sphereRadius}
        patternScale={patternScale}
        threshold={threshold}
      />
    </EffectComposer>
  )
}
