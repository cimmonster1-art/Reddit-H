import * as THREE from 'three';
import type { Fossil } from '../../../shared/types.js';
import { PLANET_RADIUS } from './PlanetShell.js';

// Iconic old posts crystallised as glowing amber shards in the planet crust.
// Each fossil gets a deterministic position from its id, a cluster of cone
// shards oriented outward, and a slow emissive pulse proportional to lift.
export class FossilLayer {
  readonly group = new THREE.Group();
  private materials: THREE.MeshStandardMaterial[] = [];
  private baseIntensities: number[] = [];

  constructor(fossils: Fossil[]) {
    for (const f of fossils.slice(0, 8)) this.buildCrystal(f);
  }

  private buildCrystal(fossil: Fossil): void {
    const seed = fossilHash(fossil.id);
    const phi = seed * Math.PI * 2;
    const theta = Math.acos(2 * frac(seed * 7.3) - 1);
    const r = PLANET_RADIUS * 0.99;
    const surfacePos = new THREE.Vector3(
      r * Math.sin(theta) * Math.cos(phi),
      r * Math.cos(theta),
      r * Math.sin(theta) * Math.sin(phi),
    );

    const cluster = new THREE.Group();
    cluster.position.copy(surfacePos);
    const outward = surfacePos.clone().normalize();
    cluster.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), outward);

    const count = 3 + Math.floor(frac(seed * 13.7) * 3);
    const liftNorm = Math.min(1, Math.log10(2 + fossil.lift) / 4);
    const hue = (35 + liftNorm * 25) / 360;
    const color = new THREE.Color().setHSL(hue, 0.82, 0.62);
    const base = 0.3 + liftNorm * 0.7;

    for (let i = 0; i < count; i++) {
      const ss = frac(seed + i * 0.37);
      const geo = new THREE.ConeGeometry(0.1 + ss * 0.09, 0.45 + ss * 0.85, 5);
      const mat = new THREE.MeshStandardMaterial({
        color, metalness: 0.72, roughness: 0.14,
        emissive: color, emissiveIntensity: base,
      });
      this.materials.push(mat);
      this.baseIntensities.push(base);
      const mesh = new THREE.Mesh(geo, mat);
      const angle = (i / count) * Math.PI * 2;
      mesh.position.set(Math.cos(angle) * 0.22, 0, Math.sin(angle) * 0.22);
      mesh.rotation.z = (ss - 0.5) * 0.55;
      cluster.add(mesh);
    }
    this.group.add(cluster);
  }

  update(_dt: number, elapsed: number): void {
    for (let i = 0; i < this.materials.length; i++) {
      this.materials[i].emissiveIntensity = this.baseIntensities[i] * (0.8 + 0.2 * Math.sin(elapsed * 0.72 + i * 0.31));
    }
  }

  dispose(): void {
    for (const m of this.materials) m.dispose();
  }
}

function fossilHash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = Math.imul(31, h) + id.charCodeAt(i) | 0;
  return (h >>> 0) / 0xFFFFFFFF;
}

function frac(n: number): number { return n - Math.floor(n); }
