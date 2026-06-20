import * as THREE from 'three';
import { createSpriteLabel, disposeSpriteLabel } from '../../../design-system/index.js';
import type { Species } from '../../../shared/types.js';

// Recurring keyword motifs rendered as small animated creature-nodes drifting
// through deep space between galaxies. Population → size + brightness.
// Named species carry a floating label; unnamed ones are anonymous sparks.
class SpeciesCreature {
  readonly object = new THREE.Group();
  private mat: THREE.MeshStandardMaterial;
  private label: THREE.Sprite | null = null;
  private orbitCenter: THREE.Vector3;
  private orbitRadius: number;
  private orbitSpeed: number;
  private baseAngle: number;

  constructor(species: Species, index: number) {
    const seed = speciesHash(species.id);
    const phi = seed * Math.PI * 2;
    const theta = Math.acos(2 * frac(seed * 4.7) - 1);
    const dist = 175 + frac(seed * 2.3) * 130;
    this.orbitCenter = new THREE.Vector3(
      dist * Math.sin(theta) * Math.cos(phi),
      dist * Math.cos(theta) * 0.5,
      dist * Math.sin(theta) * Math.sin(phi),
    );
    this.orbitRadius = 2.8 + frac(seed * 8.1) * 5.5;
    this.orbitSpeed = 0.048 + frac(seed * 6.3) * 0.09;
    this.baseAngle = index * 2.39996;

    const pop = Math.min(1, Math.log10(1 + species.population) / 3);
    const hue = frac(seed * 3.7);
    const color = new THREE.Color().setHSL(hue, 0.72, 0.52);
    this.mat = new THREE.MeshStandardMaterial({
      color, metalness: 0.18, roughness: 0.52,
      emissive: color, emissiveIntensity: 0.28 + pop * 0.52,
    });

    const geo = new THREE.IcosahedronGeometry(0.65 + pop * 0.55, 1);
    this.object.add(new THREE.Mesh(geo, this.mat));

    if (species.named) {
      this.label = createSpriteLabel(species.name, '#cdd9e8', 0.026);
      this.label.position.set(0, 2.2, 0);
      this.object.add(this.label);
    }

    this.update(0, 0);
  }

  update(_dt: number, elapsed: number): void {
    const angle = this.baseAngle + elapsed * this.orbitSpeed;
    this.object.position.set(
      this.orbitCenter.x + Math.cos(angle) * this.orbitRadius,
      this.orbitCenter.y + Math.sin(elapsed * 0.28) * 1.4,
      this.orbitCenter.z + Math.sin(angle) * this.orbitRadius,
    );
    this.object.rotation.y = elapsed * 0.38;
  }

  dispose(): void {
    this.mat.dispose();
    if (this.label) {
      this.object.remove(this.label);
      disposeSpriteLabel(this.label);
    }
  }
}

export class SpeciesField {
  readonly group = new THREE.Group();
  private creatures: SpeciesCreature[] = [];

  constructor(species: Species[]) {
    for (const [i, s] of species.slice(0, 12).entries()) {
      const c = new SpeciesCreature(s, i);
      this.creatures.push(c);
      this.group.add(c.object);
    }
  }

  update(dt: number, elapsed: number): void {
    for (const c of this.creatures) c.update(dt, elapsed);
  }

  dispose(): void {
    for (const c of this.creatures) c.dispose();
    this.group.clear();
  }
}

function speciesHash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = Math.imul(31, h) + id.charCodeAt(i) | 0;
  return (h >>> 0) / 0xFFFFFFFF;
}

function frac(n: number): number { return n - Math.floor(n); }
