import * as THREE from 'three';
import { createGlowTexture } from '../../../design-system/index.js';
import type { ExplorerTrace } from '../../../shared/types.js';

// Other live explorers, rendered as slow comet-like light-traces sweeping the
// cosmos just beyond the galaxy shell. Each trace is driven only by an anonymous
// per-explorer seed (never a username): the seed fixes its inclined orbit, speed,
// phase and cold hue, so the same explorer always reads as the same streak of
// light. A short trailing tail fades to nothing via additive vertex colour.

const TAIL = 22; //          points per trace; head bright, tail dark
const R_MIN = 150; //        orbit radius range — outside galaxies, inside dust
const R_MAX = 196;
const GAP = 0.014; //        angular spacing between tail points (radians)

class Trace {
  readonly seed: number;
  private points: THREE.Points;
  private geo: THREE.BufferGeometry;
  private pos: Float32Array;
  private center: THREE.Vector3;
  private u = new THREE.Vector3();
  private w = new THREE.Vector3();
  private radius: number;
  private speed: number;
  private phase: number;
  private fade = 0; // 0..1 ease-in so traces arrive/leave gracefully

  constructor(seed: number, tex: THREE.Texture) {
    this.seed = seed;
    const a = frac(seed * 12.9898) * Math.PI * 2;
    const b = Math.acos(2 * frac(seed * 78.233) - 1);
    // Orbit normal from the seed, then an orthonormal in-plane basis (u, w).
    const n = new THREE.Vector3(
      Math.sin(b) * Math.cos(a),
      Math.cos(b),
      Math.sin(b) * Math.sin(a),
    );
    const ref = Math.abs(n.y) > 0.92 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    this.u.crossVectors(n, ref).normalize();
    this.w.crossVectors(n, this.u).normalize();

    this.radius = R_MIN + frac(seed * 3.71) * (R_MAX - R_MIN);
    this.speed = (0.05 + frac(seed * 5.13) * 0.09) * (frac(seed * 9.2) > 0.5 ? 1 : -1);
    this.phase = frac(seed * 2.17) * Math.PI * 2;
    this.center = new THREE.Vector3(
      (frac(seed * 6.4) - 0.5) * 24,
      (frac(seed * 1.9) - 0.5) * 40,
      (frac(seed * 8.8) - 0.5) * 24,
    );

    const hue = 0.5 + frac(seed * 4.4) * 0.12; // cold cyan → soft violet
    const col = new THREE.Color().setHSL(hue, 0.7, 0.62);
    this.pos = new Float32Array(TAIL * 3);
    const colors = new Float32Array(TAIL * 3);
    for (let i = 0; i < TAIL; i++) {
      const k = 1 - i / TAIL; // brightest at the head
      colors[i * 3] = col.r * k;
      colors[i * 3 + 1] = col.g * k;
      colors[i * 3 + 2] = col.b * k;
    }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      map: tex, vertexColors: true,
      size: 7.5, sizeAttenuation: true,
      transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(this.geo, mat);
    this.points.frustumCulled = false;
    this.write(0);
  }

  get object(): THREE.Object3D { return this.points; }

  update(dt: number, elapsed: number): void {
    this.fade = Math.min(1, this.fade + dt * 0.6);
    (this.points.material as THREE.PointsMaterial).opacity = this.fade * 0.85;
    this.write(elapsed);
  }

  private write(elapsed: number): void {
    const head = this.phase + elapsed * this.speed;
    for (let i = 0; i < TAIL; i++) {
      const a = head - i * GAP;
      const cx = Math.cos(a) * this.radius;
      const cz = Math.sin(a) * this.radius;
      this.pos[i * 3] = this.center.x + this.u.x * cx + this.w.x * cz;
      this.pos[i * 3 + 1] = this.center.y + this.u.y * cx + this.w.y * cz;
      this.pos[i * 3 + 2] = this.center.z + this.u.z * cx + this.w.z * cz;
    }
    this.geo.attributes.position.needsUpdate = true;
  }

  dispose(): void {
    this.geo.dispose();
    (this.points.material as THREE.PointsMaterial).dispose();
  }
}

export class ExplorerField {
  readonly group = new THREE.Group();
  private tex: THREE.Texture;
  private traces = new Map<number, Trace>();

  constructor() {
    this.tex = createGlowTexture(48);
  }

  /** Reconcile rendered traces with the live explorer set (keyed by seed). */
  sync(explorers: ExplorerTrace[]): void {
    const next = new Set(explorers.map((e) => e.seed));
    for (const [seed, trace] of this.traces) {
      if (next.has(seed)) continue;
      this.group.remove(trace.object);
      trace.dispose();
      this.traces.delete(seed);
    }
    for (const e of explorers) {
      if (this.traces.has(e.seed)) continue;
      const trace = new Trace(e.seed, this.tex);
      this.traces.set(e.seed, trace);
      this.group.add(trace.object);
    }
  }

  update(dt: number, elapsed: number): void {
    for (const t of this.traces.values()) t.update(dt, elapsed);
  }

  dispose(): void {
    for (const t of this.traces.values()) t.dispose();
    this.traces.clear();
    this.tex.dispose();
    this.group.clear();
  }
}

function frac(n: number): number { return n - Math.floor(n); }
