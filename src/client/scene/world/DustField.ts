import * as THREE from 'three';
import { createGlowTexture, createStarTexture } from '../../../design-system/index.js';

// Deep-space depth: two parallax point layers behind everything. A vast, dim
// dust haze (cold blue-white, thousands of tiny points) and a sparser field of
// faint diffraction stars. Subdued on purpose — it reads as expensive distance,
// never as glitter. Slow counter-drift gives the void genuine parallax as the
// orbit camera moves. Both layers own their textures and dispose cleanly.
const DUST = 2600;
const STARS = 520;

function shell(count: number, rMin: number, rMax: number): Float32Array {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Uniform direction on the sphere, random radius in the shell.
    const u = Math.random() * 2 - 1;
    const t = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const r = rMin + Math.random() * (rMax - rMin);
    pos[i * 3]     = Math.cos(t) * s * r;
    pos[i * 3 + 1] = u * r;
    pos[i * 3 + 2] = Math.sin(t) * s * r;
  }
  return pos;
}

export class DustField {
  readonly group = new THREE.Group();
  private dust: THREE.Points;
  private stars: THREE.Points;
  private dustMat: THREE.PointsMaterial;
  private starMat: THREE.PointsMaterial;
  private dustGeo: THREE.BufferGeometry;
  private starGeo: THREE.BufferGeometry;
  private dustTex: THREE.Texture;
  private starTex: THREE.Texture;

  constructor() {
    this.dustTex = createGlowTexture(48);
    this.starTex = createStarTexture(64);

    // Far dust haze — cold, near-monochrome, faint.
    this.dustGeo = new THREE.BufferGeometry();
    this.dustGeo.setAttribute('position', new THREE.BufferAttribute(shell(DUST, 850, 2000), 3));
    const dustColors = new Float32Array(DUST * 3);
    const c = new THREE.Color();
    for (let i = 0; i < DUST; i++) {
      // Subtle hue scatter between cold teal and pale violet, low saturation.
      c.setHSL(0.55 + Math.random() * 0.12, 0.28, 0.5 + Math.random() * 0.25);
      dustColors[i * 3] = c.r; dustColors[i * 3 + 1] = c.g; dustColors[i * 3 + 2] = c.b;
    }
    this.dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));
    this.dustMat = new THREE.PointsMaterial({
      map: this.dustTex, vertexColors: true,
      size: 9, sizeAttenuation: true,
      transparent: true, opacity: 0.28,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.dust = new THREE.Points(this.dustGeo, this.dustMat);
    this.dust.frustumCulled = false;

    // Sparser bright stars with a crisp diffraction flare.
    this.starGeo = new THREE.BufferGeometry();
    this.starGeo.setAttribute('position', new THREE.BufferAttribute(shell(STARS, 650, 1700), 3));
    this.starMat = new THREE.PointsMaterial({
      map: this.starTex, color: 0xcfe3ff,
      size: 16, sizeAttenuation: true,
      transparent: true, opacity: 0.5,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.stars = new THREE.Points(this.starGeo, this.starMat);
    this.stars.frustumCulled = false;

    this.group.add(this.dust, this.stars);
  }

  update(_dt: number, elapsed: number): void {
    // Two slightly different drift rates so the layers separate into parallax.
    this.dust.rotation.y = elapsed * 0.004;
    this.stars.rotation.y = -elapsed * 0.0022;
    // Barely-perceptible twinkle on the bright field.
    this.starMat.opacity = 0.42 + 0.1 * Math.sin(elapsed * 0.5);
  }

  dispose(): void {
    this.dustGeo.dispose();
    this.starGeo.dispose();
    this.dustMat.dispose();
    this.starMat.dispose();
    this.dustTex.dispose();
    this.starTex.dispose();
    this.group.clear();
  }
}
