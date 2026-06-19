/**
 * Procedural deep-space nebula backdrop — ported from Bio-Galaxy
 * (src/three/shaders/nebula.ts) and re-tuned to Reddit-H's darker void
 * palette (#05060d / #0a0d1f) while keeping the full FBM star-field intact.
 *
 * Drop-in usage:
 *   const { mesh, material } = createNebulaBackground();
 *   scene.add(mesh);
 *   // inside your animation loop:
 *   material.uniforms.uTime.value += delta;
 */

import * as THREE from 'three';
import { COLOR } from './tokens.js';

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  varying vec3  vDir;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),
          mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
          mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vDir);
    float clouds = fbm(dir * 3.0 + vec3(0.0, 0.0, uTime * 0.01));
    clouds = smoothstep(0.45, 0.95, clouds);

    vec3 col = mix(uColorA, uColorB, clouds);

    // sparse star field
    float stars     = pow(noise(dir * 220.0),        24.0) * 3.6;
    float fineStars = pow(noise(dir * 510.0 + 4.0),  30.0) * 2.0;
    float band = pow(max(0.0, 1.0 - abs(dir.y * 1.8 + sin(dir.x * 4.0) * 0.12)), 5.0);
    float dust = fbm(dir * 8.0 + vec3(uTime * 0.002, 0.0, 0.0)) * band;
    col += vec3(stars + fineStars);
    // tint nebula dust with oxygen-blue rather than pure cyan
    col += vec3(0.04, 0.10, 0.14) * dust;

    // vignette toward poles
    float depth = smoothstep(1.0, 0.2, abs(dir.y));
    col *= mix(0.45, 1.0, depth);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export interface NebulaOptions {
  /** Sphere radius; should exceed camera far-plane / 2. Default 900. */
  radius?: number;
  /** Darkest void colour. Defaults to Reddit-H bg (#05060d). */
  colorA?: THREE.ColorRepresentation;
  /** Nebula cloud highlights. Defaults to deep navy-blue (#0b1e3a). */
  colorB?: THREE.ColorRepresentation;
}

export function createNebulaBackground(opts: NebulaOptions = {}): {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
} {
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTime:   { value: 0 },
      uColorA: { value: new THREE.Color(opts.colorA ?? '#' + COLOR.void0.toString(16).padStart(6, '0')) },
      uColorB: { value: new THREE.Color(opts.colorB ?? '#0b1e3a') },
    },
  });
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(opts.radius ?? 900, 32, 32),
    material,
  );
  mesh.name = 'NebulaBackground';
  mesh.frustumCulled = false;
  return { mesh, material };
}
