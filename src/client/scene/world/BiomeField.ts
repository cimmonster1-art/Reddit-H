import * as THREE from 'three';
import { COLOR, createSpriteLabel, disposeSpriteLabel } from '../../../design-system/index.js';
import { PLANET_RADIUS } from './PlanetShell.js';
import { GalaxyHalo } from './GalaxyHalo.js';
import type { Raycastable, SelectionPayload, FocusFrame } from '../raycastable.js';
import type { FoundationalBiome } from '../../world/foundational.js';

// Each foundational subreddit becomes a galaxy anchored on the cosmos surface:
// a small PBR core sphere + a spiral particle halo + a floating name label.
// The home galaxy is tinted oxygen-blue; others use their biome hue.
function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi   = (90 - lat) * (Math.PI / 180);
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
  readonly baseScale: number;
  readonly color: number;
  private baseEmissive: number;
  private mat: THREE.MeshStandardMaterial;
  private phase = Math.random() * Math.PI * 2;
  private hovered = false;
  private label: THREE.Sprite;
  private activity = 0.4; //        live energy, eased
  private targetActivity = 0.4;

  constructor(readonly biome: FoundationalBiome, home: boolean) {
    const pos = latLonToVec3(biome.lat, biome.lon, PLANET_RADIUS * 1.05);
    this.baseScale   = 5 + biome.weight * 10;
    this.baseEmissive = home ? 0.75 : 0.42;
    this.color = home
      ? COLOR.oxygen
      : new THREE.Color().setHSL(biome.hue / 360, 0.6, 0.58).getHex();

    this.mat = new THREE.MeshStandardMaterial({
      color: this.color, metalness: 0.38, roughness: 0.28,
      emissive: this.color, emissiveIntensity: this.baseEmissive,
    });
    const blob = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 20), this.mat);
    blob.castShadow = true;
    blob.receiveShadow = true;
    this.object.add(blob);
    this.object.position.copy(pos);
    this.object.scale.setScalar(this.baseScale);
    this.payload = { kind: 'biome', id: biome.id, label: `r/${biome.sub}`, data: biome };

    this.label = createSpriteLabel(`r/${biome.sub}`, home ? '#aee3ff' : '#cdd9e8', home ? 0.05 : 0.04);
    this.label.position.set(0, 2.2, 0);
    this.object.add(this.label);
  }

  setHover(on: boolean): void {
    this.hovered = on;
    this.object.scale.setScalar(this.baseScale * (on ? 1.18 : 1));
    this.mat.emissiveIntensity = this.baseEmissive * (on ? 1.7 : 1);
  }

  /** Feed live subreddit activity (0..1) — drives glow level + pulse vigour. */
  setActivity(level: number): void {
    this.targetActivity = Math.max(0, Math.min(1, level));
  }

  pulse(dt: number, elapsed: number): void {
    this.activity += (this.targetActivity - this.activity) * (1 - Math.exp(-2 * dt));
    if (this.hovered) return;
    // A busy galaxy sits brighter and breathes deeper + faster.
    const lit  = this.baseEmissive * (0.7 + this.activity * 0.9);
    const amp  = 0.08 + this.activity * 0.26;
    const rate = 0.6 + this.activity * 0.9;
    this.mat.emissiveIntensity = lit * (1 + amp * Math.sin(elapsed * rate + this.phase));
  }

  focus(): FocusFrame {
    return { center: this.object.position.clone(), radius: this.baseScale * 3.5 };
  }

  dispose(): void {
    this.object.remove(this.label);
    disposeSpriteLabel(this.label);
    this.mat.dispose();
    this.object.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).geometry.dispose(); });
  }
}

export class BiomeField {
  readonly group = new THREE.Group();
  readonly nodes: BiomeNode[] = [];
  private halos: GalaxyHalo[] = [];
  private web: THREE.LineSegments | null = null;
  private webMat: THREE.LineBasicMaterial | null = null;

  constructor(biomes: FoundationalBiome[], homeId: string) {
    for (const b of biomes) {
      const node = new BiomeNode(b, b.id === homeId);
      this.nodes.push(node);
      this.group.add(node.object);

      // Halo sits at the same world position as the node, as a sibling inside
      // the field group so it shares the cosmos rotation.
      const halo = new GalaxyHalo(node.color, node.baseScale * 2.8);
      halo.group.position.copy(node.object.position);
      this.halos.push(halo);
      this.group.add(halo.group);
    }

    // Cosmic web — thin additive filaments connecting adjacent galaxies.
    const pts: number[] = [];
    const pos = this.nodes.map((n) => n.object.position);
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        if (pos[i].distanceTo(pos[j]) < 150) {
          pts.push(pos[i].x, pos[i].y, pos[i].z, pos[j].x, pos[j].y, pos[j].z);
        }
      }
    }
    if (pts.length) {
      this.webMat = new THREE.LineBasicMaterial({
        color: 0x27c4d9, transparent: true, opacity: 0.09,
        depthWrite: false, blending: THREE.AdditiveBlending,
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      this.web = new THREE.LineSegments(geo, this.webMat);
      this.web.frustumCulled = false;
      this.group.add(this.web);
    }
  }

  byId(id: string): BiomeNode | undefined {
    return this.nodes.find((n) => n.payload.id === id);
  }

  setHover(id: string | null): void {
    for (const n of this.nodes) n.setHover(n.payload.id === id);
  }

  /** Apply live activity keyed by subreddit slug to the matching galaxy. */
  setActivity(map: Map<string, number>): void {
    this.nodes.forEach((n, i) => {
      const level = map.get(n.biome.sub.toLowerCase());
      if (level === undefined) return;
      n.setActivity(level);
      this.halos[i]?.setActivity(level);
    });
  }

  update(dt: number, elapsed: number): void {
    this.group.rotation.y = elapsed * 0.03;
    for (const n of this.nodes) n.pulse(dt, elapsed);
    for (const h of this.halos) h.update(dt, elapsed);
  }

  dispose(): void {
    for (const n of this.nodes) n.dispose();
    for (const h of this.halos) h.dispose();
    if (this.web) { this.web.geometry.dispose(); }
    this.webMat?.dispose();
    this.group.clear();
  }
}
