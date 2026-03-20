uniform sampler2D tBlueNoise;
uniform mat4 cameraWorldMatrix;
uniform mat4 cameraProjectionMatrixInverse;
uniform float patternScale;
uniform float threshold;
uniform float pixelSize;
uniform vec2 resolution;

// Convert sRGB to linear RGB
vec3 sRGBToLinear(vec3 srgb) {
  return pow(srgb, vec3(2.2));
}

// Sphere projection mapping - like Obra Dinn
vec2 directionToSphericalUV(vec3 dir) {
  vec3 n = normalize(dir);

  // Spherical coordinates: phi (azimuth), theta (elevation)
  float phi = atan(n.z, n.x);
  float theta = asin(clamp(n.y, -1.0, 1.0));

  // Map to [0, 1] UV space
  vec2 uv = vec2(
    phi / 6.28318530718 + 0.5,  // 2*PI
    theta / 3.14159265359 + 0.5  // PI
  );

  return uv;
}

// Sphere-mapped blue noise sample at a given screen UV
float sphereDitherSample(vec2 sampleUV) {
  vec4 clip = vec4(sampleUV * 2.0 - 1.0, 0.0, 1.0);
  vec4 view = cameraProjectionMatrixInverse * clip;
  view.xyz /= view.w;
  vec3 worldDir = normalize((cameraWorldMatrix * vec4(view.xyz, 0.0)).xyz);
  vec2 sphereUV = directionToSphericalUV(worldDir);
  vec2 tiledUV = fract(sphereUV * patternScale);
  return texture2D(tBlueNoise, tiledUV).r;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // Apply pixelation effect (low-res chunky look)
  vec2 pixelatedUV = uv;
  if (pixelSize > 1.0) {
    vec2 pixelCount = resolution / pixelSize;
    pixelatedUV = floor(uv * pixelCount) / pixelCount;
  }

  // Calculate luminance
  float luma = dot(inputColor.rgb, vec3(0.299, 0.587, 0.114));

  // Apply threshold adjustment
  float adjustedLuma = clamp(luma + threshold - 0.5, 0.0, 1.0);

  // Sphere-mapped dither with 2x2 supersampling
  // Dither pattern is perfectly pinned to world space for all camera rotations
  // Samples at 2x resolution and box-downsamples for softened output
  vec2 halfPixel = 0.5 / resolution;

  float n00 = sphereDitherSample(pixelatedUV + vec2(-halfPixel.x, -halfPixel.y));
  float n10 = sphereDitherSample(pixelatedUV + vec2( halfPixel.x, -halfPixel.y));
  float n01 = sphereDitherSample(pixelatedUV + vec2(-halfPixel.x,  halfPixel.y));
  float n11 = sphereDitherSample(pixelatedUV + vec2( halfPixel.x,  halfPixel.y));

  // Threshold each supersample independently
  float d00 = step(n00, adjustedLuma);
  float d10 = step(n10, adjustedLuma);
  float d01 = step(n01, adjustedLuma);
  float d11 = step(n11, adjustedLuma);

  // Box downsample: average gives softened (non-1-bit) output
  float dithered = (d00 + d10 + d01 + d11) * 0.25;

  // Custom colors: #333319 (dark gray-green) and #ffffff (white)
  vec3 darkColorSRGB = vec3(51.0/255.0, 51.0/255.0, 25.0/255.0);
  vec3 darkColor = sRGBToLinear(darkColorSRGB);
  vec3 lightColor = vec3(1.0, 1.0, 1.0);

  vec3 finalColor = mix(darkColor, lightColor, dithered);
  outputColor = vec4(finalColor, 1.0);
}
