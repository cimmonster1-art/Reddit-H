import * as THREE from 'three';
import { COLOR } from '../../../design-system/index.js';
import { PLANET_RADIUS } from './PlanetShell.js';
import type { Raycastable, SelectionPayload, FocusFrame } from '../raycastable.js';
import type { FoundationalBiome } from '../../world/foundational.js';

// Each foundational subreddit becomes a glowing organ-node anchored on the
// planet surface, raycastable as a 'biome'. Hover scales it up; the live home
// biome is tinted with the oxygen accent so it reads as 'yours'.
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

  constructor(readonly biome: FoundationalBiome, home: boolean) {
    const pos = latLonToVec3(biome.lat, biome.lon, PLANET_RADIUS * 1.04);
    this.baseScale = 6 + biome.weight * 14;
    const color = home ? COLOR.oxygen : new THREE.Color().setHSL(biome.hue / 360, 0.6, 0.6).getHex();
    const blob = new THREE.Mesh(
      new THREE.SphereGeometry(1, 20, 20),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: home ? 0.9 : 0.5, roughness: 0.5 }),
    );
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ color, transparent: true, opacity: 0.35, depthWrite: false }));
    halo.scale.setScalar(2.6);
    this.object.add(blob, halo);
    this.object.position.copy(pos);
    this.object.scale.setScalar(this.baseScale);
    this.payload = { kind: 'biome', id: biome.id, label: `r/${biome.sub}`, data: biome };
  }

  setHover(on: boolean): void {
    this.object.scale.setScalar(this.baseScale * (on ? 1.25 : 1));
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
    this.group.rotation.y = elapsed * 0.03; // ride along with the planet spin
  }
}
