import * as THREE from 'three';
import { createGlowTexture } from '../../../design-system/index.js';

// Shared glow texture across all galaxy halos — allocated once, never disposed
// while the page is live (the module owns it).
let _glowTex: THREE.Texture | null = null;
function glowTex(): THREE.Texture {
  if (!_glowTex) _glowTex = createGlowTexture(128);
  return _glowTex;
}

const PARTICLES = 320;
const GOLDEN = 2.39996; // golden angle rad

// A spiral particle disc + additive glow sprite placed at each galaxy center.
// Sits in world space as a sibling of its BiomeNode inside BiomeField.group so
// it shares the same slow cosmos rotation. Radius and color come from the node.
export class GalaxyHalo {
  readonly group = new THREE.Group();
  private disc: THREE.Points;
  private geo: THREE.BufferGeometry;
  private discMat: THREE.PointsMaterial;
  private glow: THREE.Sprite;
  private glowMat: THREE.SpriteMaterial;

  constructor(color: number, radius: number) {
    // Local glow texture per halo (needs unique tint; shares the base map).
    const localTex = createGlowTexture(64);

    // Spiral arm particle positions in local space (radius units).
    const pos = new Float32Array(PARTICLES * 3);
    for (let i = 0; i < PARTICLES; i++) {
      const t = Math.random() ** 0.55;
      const r = t * radius;
      const theta = i * GOLDEN + r * 0.45;     // golden angle + spiral wind
      const h = (Math.random() - 0.5) * radius * 0.09 * (1 - t);
      pos[i * 3]     = Math.cos(theta) * r;
      pos[i * 3 + 1] = h;
      pos[i * 3 + 2] = Math.sin(theta) * r;
    }

    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.discMat = new THREE.PointsMaterial({
      map: localTex,
      color: new THREE.Color(color),
      size: Math.max(1.8, radius * 0.16),
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.disc = new THREE.Points(this.geo, this.discMat);
    this.disc.frustumCulled = false;

    // Large additive glow sprite — the luminous galaxy core.
    this.glowMat = new THREE.SpriteMaterial({
      map: glowTex(),
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.glow = new THREE.Sprite(this.glowMat);
    this.glow.scale.setScalar(radius * 1.8);

    this.group.add(this.disc, this.glow);
  }

  update(dt: number): void {
    this.disc.rotation.y += dt * 0.055; // gentle rotation independent of cosmos spin
  }

  dispose(): void {
    this.discMat.map?.dispose();
    this.discMat.dispose();
    this.glowMat.dispose();
    this.geo.dispose();
  }
}
