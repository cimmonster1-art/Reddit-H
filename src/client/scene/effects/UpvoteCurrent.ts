import * as THREE from 'three';
import { COLOR } from '../../../design-system/index.js';

// Pooled particle current — lift / upvotes rendered as cold rising motes around
// the cosmos. Fixed pool, no per-frame allocation, recycled at the top of each
// column. Additive so the bloom pass catches them. Intensity scales with
// overnight bloodflow.
export class UpvoteCurrent {
  readonly points: THREE.Points;
  private positions: Float32Array;
  private speeds: Float32Array;
  private count: number;
  private radius: number;

  constructor(count = 520, radius = 150) {
    this.count = count;
    this.radius = radius;
    this.positions = new Float32Array(count * 3);
    this.speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) this.reset(i, true);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    const mat = new THREE.PointsMaterial({
      color: COLOR.accent, size: 1.3, transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
  }

  setIntensity(bloodflow: number): void {
    (this.points.material as THREE.PointsMaterial).opacity = 0.35 + Math.min(0.45, bloodflow / 6000);
  }

  private reset(i: number, spread: boolean): void {
    const a = Math.random() * Math.PI * 2;
    const r = this.radius * (0.7 + Math.random() * 0.5);
    this.positions[i * 3] = Math.cos(a) * r;
    this.positions[i * 3 + 1] = spread ? (Math.random() - 0.5) * this.radius * 2 : -this.radius;
    this.positions[i * 3 + 2] = Math.sin(a) * r;
    this.speeds[i] = 12 + Math.random() * 24;
  }

  update(dt: number): void {
    for (let i = 0; i < this.count; i++) {
      this.positions[i * 3 + 1] += this.speeds[i] * dt;
      if (this.positions[i * 3 + 1] > this.radius) this.reset(i, false);
    }
    (this.points.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  }
}
