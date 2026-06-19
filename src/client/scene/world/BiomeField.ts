import * as THREE from 'three';
import { COLOR } from '../../../design-system/index.js';
import { PLANET_RADIUS } from './PlanetShell.js';
import type { Raycastable, SelectionPayload, FocusFrame } from '../raycastable.js';
import type { FoundationalBiome } from '../../world/foundational.js';

// Each foundational subreddit becomes a galaxy-node anchored on the cosmos
// surface, raycastable as a 'biome'. Shadowed PBR spheres with a low emissive
// so they catch the rim light and bloom softly rather than glowing flatly. The
// home galaxy is tinted with the oxygen accent so it reads as 'yours'.
function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

class BiomeNode implements Raycastable {
  readonly object = new THREE.Group();
  readonly payload: SelectionPayload;
  private baseScale: number;
  private baseEmissive: number;
  private mat: THREE.MeshStandardMaterial;
  private phase = Math.random() * Math.PI * 2;
  private hovered = false;

  constructor(readonly biome: FoundationalBiome, home: boolean) {
    const pos = latLonToVec3(biome.lat, biome.lon, PLANET_RADIUS * 1.05);
    this.baseScale = 6 + biome.weight * 14;
    this.baseEmissive = home ? 0.7 : 0.4;
    const color = home ? COLOR.oxygen : new THREE.Color().setHSL(biome.hue / 360, 0.55, 0.55).getHex();
    this.mat = new THREE.MeshStandardMaterial({
      color, metalness: 0.35, roughness: 0.3, emissive: color, emissiveIntensity: this.baseEmissive,
    });
    const blob = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 24), this.mat);
    blob.castShadow = true;
    blob.receiveShadow = true;
    this.object.add(blob);
    this.object.position.copy(pos);
    this.object.scale.setScalar(this.baseScale);
    this.payload = { kind: 'biome', id: biome.id, label: `r/${biome.sub}`, data: biome };
  }

  setHover(on: boolean): void {
    this.hovered = on;
    this.object.scale.setScalar(this.baseScale * (on ? 1.22 : 1));
    this.mat.emissiveIntensity = this.baseEmissive * (on ? 1.6 : 1);
  }

  // A slow emissive breath so each galaxy reads as alive. Cheap (one uniform),
  // and skipped while hovered so it never fights the hover highlight.
  pulse(elapsed: number): void {
    if (this.hovered) return;
    this.mat.emissiveIntensity = this.baseEmissive * (1 + 0.12 * Math.sin(elapsed * 0.8 + this.phase));
  }

  focus(): FocusFrame {
    return { center: this.object.position.clone(), radius: this.baseScale * 3.2 };
  }
}

export class BiomeField {
  readonly group = new THREE.Group();
  readonly nodes: BiomeNode[] = [];

  constructor(biomes: FoundationalBiome[], homeId: string) {
    for (const b of biomes) {
      const node = new BiomeNode(b, b.id === homeId);
      this.nodes.push(node);
      this.group.add(node.object);
    }
  }

  byId(id: string): BiomeNode | undefined {
    return this.nodes.find((n) => n.payload.id === id);
  }

  setHover(id: string | null): void {
    for (const n of this.nodes) n.setHover(n.payload.id === id);
  }

  update(_dt: number, elapsed: number): void {
    this.group.rotation.y = elapsed * 0.03; // ride the cosmos spin
    for (const n of this.nodes) n.pulse(elapsed);
  }
}
