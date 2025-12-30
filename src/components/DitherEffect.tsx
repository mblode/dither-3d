import { useThree } from "@react-three/fiber";
import { Effect } from "postprocessing";
import { forwardRef, useMemo } from "react";
import {
  type Camera,
  RepeatWrapping,
  type Texture,
  TextureLoader,
  Uniform,
  Vector2,
  Vector3,
  type WebGLRenderer,
  type WebGLRenderTarget,
} from "three";
import fragmentShader from "../shaders/dither.frag";

// Custom Dither Effect class
class DitherEffectImpl extends Effect {
  constructor(
    blueNoiseTexture: Texture,
    camera: Camera,
    patternScale: number,
    threshold: number,
    pixelSize: number,
    resolution: Vector2,
  ) {
    // Set up texture wrapping for tiling
    blueNoiseTexture.wrapS = RepeatWrapping;
    blueNoiseTexture.wrapT = RepeatWrapping;

    super("DitherEffect", fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ["tBlueNoise", new Uniform(blueNoiseTexture)],
        ["patternScale", new Uniform(patternScale)],
        ["threshold", new Uniform(threshold)],
        ["pixelSize", new Uniform(pixelSize)],
        ["resolution", new Uniform(resolution)],
        ["cameraPosition", new Uniform(new Vector3())],
        ["cameraWorldMatrix", new Uniform(camera.matrixWorld)],
        [
          "cameraProjectionMatrixInverse",
          new Uniform(camera.projectionMatrixInverse),
        ],
      ]),
    });

    this.cameraRef = camera;
  }

  private cameraRef: Camera;

  update(
    _renderer: WebGLRenderer,
    inputBuffer: WebGLRenderTarget,
    _deltaTime: number,
  ) {
    // Update camera uniforms each frame
    if (this.cameraRef) {
      const cameraPos = this.uniforms.get("cameraPosition");
      const cameraWorldMatrix = this.uniforms.get("cameraWorldMatrix");
      const cameraProjectionMatrixInverse = this.uniforms.get(
        "cameraProjectionMatrixInverse",
      );

      if (cameraPos) cameraPos.value.copy(this.cameraRef.position);
      if (cameraWorldMatrix)
        cameraWorldMatrix.value = this.cameraRef.matrixWorld;
      if (cameraProjectionMatrixInverse)
        cameraProjectionMatrixInverse.value =
          this.cameraRef.projectionMatrixInverse;
    }

    // Update resolution uniform
    const width = inputBuffer.width;
    const height = inputBuffer.height;
    const resolution = this.uniforms.get("resolution");
    if (resolution) resolution.value.set(width, height);
  }
}

// Props interface
interface DitherEffectProps {
  patternScale?: number;
  threshold?: number;
  pixelSize?: number;
}

// React component wrapper
const DitherEffect = forwardRef<typeof DitherEffectImpl, DitherEffectProps>(
  ({ patternScale = 20.0, threshold = 0.5, pixelSize = 1.0 }, ref) => {
    const { camera, size } = useThree();

    // Load blue noise texture
    const blueNoiseTexture = useMemo(() => {
      const loader = new TextureLoader();
      return loader.load("/blue-noise.png");
    }, []);

    // Create effect instance with camera
    const effect = useMemo(() => {
      const resolution = new Vector2(size.width, size.height);
      return new DitherEffectImpl(
        blueNoiseTexture,
        camera,
        patternScale,
        threshold,
        pixelSize,
        resolution,
      );
    }, [blueNoiseTexture, camera, patternScale, threshold, pixelSize, size]);

    // Update uniform values when props change
    useMemo(() => {
      if (effect) {
        const patternScaleUniform = effect.uniforms.get("patternScale");
        const thresholdUniform = effect.uniforms.get("threshold");
        const pixelSizeUniform = effect.uniforms.get("pixelSize");

        if (patternScaleUniform) patternScaleUniform.value = patternScale;
        if (thresholdUniform) thresholdUniform.value = threshold;
        if (pixelSizeUniform) pixelSizeUniform.value = pixelSize;
      }
    }, [effect, patternScale, threshold, pixelSize]);

    return <primitive ref={ref} object={effect} dispose={null} />;
  },
);

DitherEffect.displayName = "DitherEffect";

export default DitherEffect;
