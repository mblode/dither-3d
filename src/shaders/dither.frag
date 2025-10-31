uniform sampler2D tBlueNoise;
uniform mat4 cameraWorldMatrix;
uniform mat4 cameraProjectionMatrixInverse;
uniform float sphereRadius;
uniform float patternScale;
uniform float threshold;

// Convert sRGB to linear RGB
vec3 sRGBToLinear(vec3 srgb) {
  return pow(srgb, vec3(2.2));
}

vec2 directionToSphericalUV(vec3 dir) {
  vec3 n = normalize(dir);
  float phi = atan(n.z, n.x);
  float theta = asin(clamp(n.y, -1.0, 1.0));
  return vec2(phi / 6.28318 + 0.5, theta / 3.14159 + 0.5);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // Reconstruct view direction
  vec4 clip = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
  vec4 view = cameraProjectionMatrixInverse * clip;
  view.xyz /= view.w;

  // Transform to world space
  vec3 worldDir = normalize((cameraWorldMatrix * vec4(view.xyz, 0.0)).xyz);

  // Map to sphere
  vec2 sphereUV = directionToSphericalUV(worldDir * sphereRadius);
  vec2 tiledUV = fract(sphereUV * patternScale);

  // Dither
  float noise = texture2D(tBlueNoise, tiledUV).r;
  float luma = dot(inputColor.rgb, vec3(0.299, 0.587, 0.114));
  float adjusted = clamp(luma + threshold - 0.5, 0.0, 1.0);
  float dithered = step(noise, adjusted);

  // Custom colors: #333319 (dark gray-green) and #ffffff (white)
  // Convert from sRGB hex values to linear RGB for proper rendering
  vec3 darkColorSRGB = vec3(51.0/255.0, 51.0/255.0, 25.0/255.0);  // #333319 in sRGB
  vec3 darkColor = sRGBToLinear(darkColorSRGB);
  vec3 lightColor = vec3(1.0, 1.0, 1.0);  // #ffffff (white)
  vec3 finalColor = mix(darkColor, lightColor, dithered);

  outputColor = vec4(finalColor, 1.0);
}
