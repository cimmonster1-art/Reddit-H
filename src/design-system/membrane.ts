/**
 * Translucent Fresnel membrane shader — ported from Bio-Galaxy
 * (src/three/shaders/membrane.ts). Fits the cell-wall and organism-skin
 * moments in OrganismScene.ts with no changes needed.
 *
 * Usage:
 *   const mat = createMembraneMaterial({ color: 0x7c8cff, rimColor: 0xaee3ff });
 *   const mesh = new THREE.Mesh(geometry, mat);
 *   // animation loop:
 *   mat.uniforms.uTime.value += delta;
 */

import * as THREE from 'three';
import { COLOR } from './tokens.js';

const vertexShader = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3  uColor;
  uniform vec3  uRimColor;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uRimPower;

  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

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

  void main() {
    vec3  viewDir = normalize(cameraPosition - vWorldPos);
    vec3  normal  = normalize(vWorldNormal);
    float fresnel = pow(1.0 - clamp(dot(normal, viewDir), 0.0, 1.0), uRimPower);

    float flow = noise(vWorldPos * 0.25 + vec3(0.0, uTime * 0.15, 0.0));
    vec3  base = mix(uColor, uRimColor, fresnel);
    base += uRimColor * flow * 0.12;

    float alpha = uOpacity + fresnel * 0.55;
    gl_FragColor = vec4(base, clamp(alpha, 0.0, 1.0));
  }
`;

export interface MembraneOptions {
  /** Base fill colour. Defaults to Reddit-H nerve (0x7c8cff). */
  color?:    THREE.ColorRepresentation;
  /** Fresnel rim glow. Defaults to oxygen (0xaee3ff). */
  rimColor?: THREE.ColorRepresentation;
  opacity?:  number;
  rimPower?: number;
}

export function createMembraneMaterial(opts: MembraneOptions = {}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite:  false,
    side:        THREE.DoubleSide,
    blending:    THREE.NormalBlending,
    uniforms: {
      uColor:    { value: new THREE.Color(opts.color    ?? COLOR.nerve) },
      uRimColor: { value: new THREE.Color(opts.rimColor ?? COLOR.oxygen) },
      uTime:     { value: 0 },
      uOpacity:  { value: opts.opacity  ?? 0.06 },
      uRimPower: { value: opts.rimPower ?? 2.2 },
    },
  });
}
