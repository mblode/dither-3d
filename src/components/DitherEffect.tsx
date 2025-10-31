import { forwardRef, useMemo } from 'react'
import { Effect } from 'postprocessing'
import { Uniform, Texture, TextureLoader, RepeatWrapping, Vector3, Matrix4 } from 'three'
import { useThree } from '@react-three/fiber'
import fragmentShader from '../shaders/dither.frag'

// Custom Dither Effect class
class DitherEffectImpl extends Effect {
  constructor(
    blueNoiseTexture: Texture,
    camera: any,
    sphereRadius: number,
    patternScale: number,
    threshold: number
  ) {
    // Set up texture wrapping for tiling
    blueNoiseTexture.wrapS = RepeatWrapping
    blueNoiseTexture.wrapT = RepeatWrapping

    super('DitherEffect', fragmentShader, {
      uniforms: new Map<string, Uniform<any>>([
        ['tBlueNoise', new Uniform(blueNoiseTexture)],
        ['sphereRadius', new Uniform(sphereRadius)],
        ['patternScale', new Uniform(patternScale)],
        ['threshold', new Uniform(threshold)],
        ['cameraPosition', new Uniform(new Vector3())],
        ['cameraWorldMatrix', new Uniform(camera.matrixWorld)],
        ['cameraProjectionMatrixInverse', new Uniform(camera.projectionMatrixInverse)]
      ])
    })

    this.cameraRef = camera
  }

  private cameraRef: any

  update(renderer: any, inputBuffer: any, deltaTime: number) {
    // Update camera uniforms each frame
    if (this.cameraRef) {
      this.uniforms.get('cameraPosition')!.value.copy(this.cameraRef.position)
      this.uniforms.get('cameraWorldMatrix')!.value = this.cameraRef.matrixWorld
      this.uniforms.get('cameraProjectionMatrixInverse')!.value = this.cameraRef.projectionMatrixInverse
    }
  }
}

// Props interface
interface DitherEffectProps {
  sphereRadius?: number
  patternScale?: number
  threshold?: number
}

// React component wrapper
const DitherEffect = forwardRef<typeof DitherEffectImpl, DitherEffectProps>(
  ({ sphereRadius = 10.0, patternScale = 20.0, threshold = 0.5 }, ref) => {
    const { camera } = useThree()

    // Load blue noise texture
    const blueNoiseTexture = useMemo(() => {
      const loader = new TextureLoader()
      return loader.load('/blue-noise.png')
    }, [])

    // Create effect instance with camera
    const effect = useMemo(() => {
      return new DitherEffectImpl(blueNoiseTexture, camera, sphereRadius, patternScale, threshold)
    }, [blueNoiseTexture, camera, sphereRadius, patternScale, threshold])

    // Update uniform values when props change
    useMemo(() => {
      if (effect) {
        effect.uniforms.get('sphereRadius')!.value = sphereRadius
        effect.uniforms.get('patternScale')!.value = patternScale
        effect.uniforms.get('threshold')!.value = threshold
      }
    }, [effect, sphereRadius, patternScale, threshold])

    return <primitive ref={ref} object={effect} dispose={null} />
  }
)

DitherEffect.displayName = 'DitherEffect'

export default DitherEffect
