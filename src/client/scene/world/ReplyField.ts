import * as THREE from 'three';
import { COLOR } from '../../../design-system/index.js';
import type { Raycastable, SelectionPayload, FocusFrame } from '../raycastable.js';
import type { ReplyBranch } from '../../../shared/types.js';

// A comment-moon's replies as smaller satellites orbiting it. Tighter, faster
// orbits than the comment moons so the nesting reads at a glance. Score maps to
// fuel/brightness, recency to drift. Lazily built on dive, disposed on surface.
class ReplySatellite implements Raycastable {
  readonly object = new THREE.Group();
  readonly payload: SelectionPayload;
  private base: number;
  private mat: THREE.MeshStandardMaterial;
  private orbit: number;
  private angle: number;
  private speed: number;

  constructor(reply: ReplyBranch, private center: THREE.Vector3, index: number, geo: THREE.SphereGeometry) {
    this.orbit = 2.4 + index * 0.7;
    this.angle = index * 2.39996;
    this.speed = 0.12 + (1 / (1 + reply.ageHours)) * 0.25;

    const fuel = Math.min(1, Math.log10(2 + Math.max(0, reply.score)) / 3);
    this.base = 0.32 + fuel * 0.6;
    const color = new THREE.Color().lerpColors(
      new THREE.Color(COLOR.spore), new THREE.Color(COLOR.accent), fuel,
    );
    this.mat = new THREE.MeshStandardMaterial({
      color, metalness: 0.25, roughness: 0.45, emissive: color, emissiveIntensity: 0.35 + fuel * 0.65,
    });
    this.object.add(new THREE.Mesh(geo, this.mat));
    this.object.scale.setScalar(this.base);
    this.payload = { kind: 'reply', id: reply.id, label: reply.excerpt, data: reply };
    this.place(0);
  }

  private place(t: number): void {
    const a = this.angle + t * this.speed;
    this.object.position.set(
      this.center.x + Math.cos(a) * this.orbit,
      this.center.y + Math.sin(a * 1.6) * this.orbit * 0.4,
      this.center.z + Math.sin(a) * this.orbit,
    );
  }

  update(_dt: number, elapsed: number): void { this.place(elapsed); }
  focus(): FocusFrame { return { center: this.object.position.clone(), radius: this.base * 4 }; }
  dispose(): void { this.mat.dispose(); }
}

export class ReplyField {
  readonly group = new THREE.Group();
  readonly nodes: ReplySatellite[] = [];
  private geo = new THREE.SphereGeometry(1, 12, 12);

  constructor(replies: ReplyBranch[], center: THREE.Vector3) {
    replies.slice(0, 6).forEach((r, i) => {
      const sat = new ReplySatellite(r, center, i, this.geo);
      this.nodes.push(sat);
      this.group.add(sat.object);
    });
  }

  byId(id: string): ReplySatellite | undefined {
    return this.nodes.find((n) => n.payload.id === id);
  }

  update(dt: number, elapsed: number): void {
    for (const n of this.nodes) n.update(dt, elapsed);
  }

  dispose(): void {
    for (const n of this.nodes) n.dispose();
    this.geo.dispose();
    this.group.clear();
  }
}
