import { useThree } from "@react-three/fiber";
import { Effect } from "postprocessing";
import { forwardRef, useMemo } from "react";
import {
  type Camera,
  Euler,
  type PerspectiveCamera,
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

const BLUE_NOISE_SIZE = 128.0;

// Custom Dither Effect class
class DitherEffectImpl extends Effect {
  constructor(
    blueNoiseTexture: Texture,
    camera: Camera,
    patternScale: number,
    threshold: number,
    pixelSize: number,
    resolution: Vector2,
    ditherMode: number
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
        ["ditherMode", new Uniform(ditherMode)],
        ["ditherOffset", new Uniform(new Vector2(0, 0))],
        ["blueNoiseSize", new Uniform(BLUE_NOISE_SIZE)],
      ]),
    });

    this.cameraRef = camera;
  }

  private readonly cameraRef: Camera;
  private readonly tempEuler = new Euler();

  update(
    _renderer: WebGLRenderer,
    inputBuffer: WebGLRenderTarget,
    _deltaTime: number
  ) {
    // Update camera uniforms each frame
    if (this.cameraRef) {
      const cameraPos = this.uniforms.get("cameraPosition");
      const cameraWorldMatrix = this.uniforms.get("cameraWorldMatrix");
      const cameraProjectionMatrixInverse = this.uniforms.get(
        "cameraProjectionMatrixInverse"
      );

      if (cameraPos) {
        cameraPos.value.copy(this.cameraRef.position);
      }
      if (cameraWorldMatrix) {
        cameraWorldMatrix.value = this.cameraRef.matrixWorld;
      }
      if (cameraProjectionMatrixInverse) {
        cameraProjectionMatrixInverse.value =
          this.cameraRef.projectionMatrixInverse;
      }

      // Compute screenspace dither offset for DIGITAL mode
      // Formula: DitherOffset = ScreenSize * CameraRotation / CameraFov
      const ditherModeUniform = this.uniforms.get("ditherMode");
      if (ditherModeUniform?.value === 0) {
        const ditherOffset = this.uniforms.get("ditherOffset");
        if (ditherOffset) {
          const cam = this.cameraRef as PerspectiveCamera;
          const vFov = (cam.fov * Math.PI) / 180;
          const aspect = cam.aspect;
          const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);

          // Extract camera rotation (yaw = Y, pitch = X)
          const euler = this.tempEuler;
          euler.setFromQuaternion(cam.quaternion, "YXZ");

          const width = inputBuffer.width;
          const height = inputBuffer.height;

          // Offset = screen pixels * rotation / fov
          ditherOffset.value.set(
            (width * euler.y) / hFov,
            (height * -euler.x) / vFov
          );
        }
      }
    }

    // Update resolution uniform
    const width = inputBuffer.width;
    const height = inputBuffer.height;
    const resolution = this.uniforms.get("resolution");
    if (resolution) {
      resolution.value.set(width, height);
    }
  }
}

// Props interface
interface DitherEffectProps {
  patternScale?: number;
  threshold?: number;
  pixelSize?: number;
  displayMode?: "DIGITAL" | "ANALOG";
}

// React component wrapper
const DitherEffect = forwardRef<typeof DitherEffectImpl, DitherEffectProps>(
  (
    {
      patternScale = 20.0,
      threshold = 0.5,
      pixelSize = 1.0,
      displayMode = "ANALOG",
    },
    ref
  ) => {
    const { camera, size } = useThree();

    const ditherMode = displayMode === "DIGITAL" ? 0 : 1;

    // Load blue noise texture
    const blueNoiseTexture = useMemo(() => {
      const loader = new TextureLoader();
      return loader.load("/blue-noise.png");
    }, []);

    // Create effect instance with camera (stable — does not recreate on mode switch)
    const effect = useMemo(() => {
      const resolution = new Vector2(size.width, size.height);
      return new DitherEffectImpl(
        blueNoiseTexture,
        camera,
        patternScale,
        threshold,
        pixelSize,
        resolution,
        0
      );
    }, [blueNoiseTexture, camera, patternScale, threshold, pixelSize, size]);

    // Update uniform values when props change (including mode switches)
    useMemo(() => {
      if (effect) {
        const patternScaleUniform = effect.uniforms.get("patternScale");
        const thresholdUniform = effect.uniforms.get("threshold");
        const pixelSizeUniform = effect.uniforms.get("pixelSize");
        const ditherModeUniform = effect.uniforms.get("ditherMode");

        if (patternScaleUniform) {
          patternScaleUniform.value = patternScale;
        }
        if (thresholdUniform) {
          thresholdUniform.value = threshold;
        }
        if (pixelSizeUniform) {
          pixelSizeUniform.value = pixelSize;
        }
        if (ditherModeUniform) {
          ditherModeUniform.value = ditherMode;
        }
      }
    }, [effect, patternScale, threshold, pixelSize, ditherMode]);

    return <primitive dispose={null} object={effect} ref={ref} />;
  }
);

DitherEffect.displayName = "DitherEffect";

export default DitherEffect;
