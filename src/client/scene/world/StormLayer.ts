import * as THREE from 'three';
import type { Storm } from '../../../shared/types.js';
import { PLANET_RADIUS } from './PlanetShell.js';

// Controversial threads rendered as red-amber particle vortices above the
// planet surface. Each storm swirls at a deterministic position derived from
// its id; intensity drives radius, opacity, and rotation speed.
const PARTICLES = 80;

class StormCloud {
  readonly points: THREE.Points;
  private mat: THREE.PointsMaterial;
  private geo: THREE.BufferGeometry;
  private buf: Float32Array;
  private base: THREE.Vector3;
  private intensity: number;
  private seed: number;
  private tangent: THREE.Vector3;
  private binormal: THREE.Vector3;
  private baseOpacity: number;

  constructor(storm: Storm) {
    this.intensity = storm.intensity;
    this.seed = stormHash(storm.id);
    const phi = this.seed * Math.PI * 2;
    const theta = Math.acos(2 * frac(this.seed * 5.7) - 1);
    const r = PLANET_RADIUS * 1.09;
    this.base = new THREE.Vector3(
      r * Math.sin(theta) * Math.cos(phi),
      r * Math.cos(theta),
      r * Math.sin(theta) * Math.sin(phi),
    );
    const outward = this.base.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);
    this.tangent = up.clone().cross(outward).normalize();
    this.binormal = outward.clone().cross(this.tangent);

    this.buf = new Float32Array(PARTICLES * 3);
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.buf, 3));

    this.baseOpacity = 0.35 + storm.intensity * 0.3;
    this.mat = new THREE.PointsMaterial({
      color: new THREE.Color().setHSL(0.05, 0.88, 0.5),
      size: 0.75,
      transparent: true,
      opacity: this.baseOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.points = new THREE.Points(this.geo, this.mat);
  }

  update(_dt: number, elapsed: number): void {
    const speed = 0.28 + this.intensity * 0.48;
    const radius = 3.5 + this.intensity * 8;
    const { x: tx, y: ty, z: tz } = this.tangent;
    const { x: bx, y: by, z: bz } = this.binormal;

    for (let i = 0; i < PARTICLES; i++) {
      const s = frac(this.seed + i * 0.071);
      const t = elapsed * speed + i * 0.157;
      const rr = radius * (0.3 + s * 0.7);
      const drift = (frac(this.seed + i * 0.133) - 0.5) * 3.5;
      this.buf[i * 3]     = this.base.x + Math.cos(t) * rr * tx + Math.sin(t) * rr * bx;
      this.buf[i * 3 + 1] = this.base.y + Math.cos(t) * rr * ty + Math.sin(t) * rr * by + drift;
      this.buf[i * 3 + 2] = this.base.z + Math.cos(t) * rr * tz + Math.sin(t) * rr * bz;
    }
    (this.geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    this.mat.opacity = this.baseOpacity * (0.72 + 0.28 * Math.sin(elapsed * 1.9));
  }

  dispose(): void {
    this.geo.dispose();
    this.mat.dispose();
  }
}

export class StormLayer {
  readonly group = new THREE.Group();
  private clouds: StormCloud[] = [];

  constructor(storms: Storm[]) {
    for (const s of storms.slice(0, 3)) {
      const c = new StormCloud(s);
      this.clouds.push(c);
      this.group.add(c.points);
    }
  }

  update(dt: number, elapsed: number): void {
    for (const c of this.clouds) c.update(dt, elapsed);
  }

  dispose(): void {
    for (const c of this.clouds) c.dispose();
    this.group.clear();
  }
}

function stormHash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = Math.imul(31, h) + id.charCodeAt(i) | 0;
  return (h >>> 0) / 0xFFFFFFFF;
}

function frac(n: number): number { return n - Math.floor(n); }
