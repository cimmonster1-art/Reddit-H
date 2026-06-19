import * as THREE from 'three';
import { COLOR } from '../../../design-system/index.js';
import type { Raycastable, SelectionPayload, FocusFrame } from '../raycastable.js';
import type { CommentNode } from '../../../shared/types.js';

// A thread's top comments as moons orbiting the thread-star. Score maps to
// fuel (brightness + mass), recency to orbital drift speed, reply depth to ring.
// Lazily built on dive and fully disposed on surface. Shares one geometry.
const GOLDEN = 2.39996; // golden angle keeps rings evenly distributed

class CommentMoon implements Raycastable {
  readonly object = new THREE.Group();
  readonly payload: SelectionPayload;
  private base: number;
  private mat: THREE.MeshStandardMaterial;
  private orbit: number;
  private angle: number;
  private speed: number;
  private incline: number;

  constructor(node: CommentNode, private center: THREE.Vector3, index: number, geo: THREE.SphereGeometry) {
    const ring = Math.floor(index / 8);
    this.orbit = 7 + ring * 4.5 + (index % 8) * 0.2;
    this.angle = index * GOLDEN;
    // newer comments drift faster; bounded so nothing spins distractingly.
    this.speed = 0.04 + (1 / (1 + node.ageHours)) * 0.16;
    this.incline = (ring % 2 === 0 ? 1 : -1) * 0.35;

    const fuel = Math.min(1, Math.log10(2 + Math.max(0, node.score)) / 3);
    this.base = 0.5 + fuel * 1.1;
    const color = new THREE.Color().lerpColors(
      new THREE.Color(COLOR.nerve), new THREE.Color(COLOR.oxygen), fuel,
    );
    this.mat = new THREE.MeshStandardMaterial({
      color, metalness: 0.3, roughness: 0.4, emissive: color, emissiveIntensity: 0.3 + fuel * 0.7,
    });
    this.object.add(new THREE.Mesh(geo, this.mat));
    this.object.scale.setScalar(this.base);
    this.payload = { kind: 'comment', id: node.id, label: node.excerpt, data: node };
    this.place(0);
  }

  private place(t: number): void {
    const a = this.angle + t * this.speed;
    this.object.position.set(
      this.center.x + Math.cos(a) * this.orbit,
      this.center.y + Math.sin(a * 1.3) * this.orbit * this.incline * 0.5,
      this.center.z + Math.sin(a) * this.orbit,
    );
  }

  update(_dt: number, elapsed: number): void { this.place(elapsed); }
  focus(): FocusFrame { return { center: this.object.position.clone(), radius: this.base * 4 }; }
  dispose(): void { this.mat.dispose(); }
}

export class CommentField {
  readonly group = new THREE.Group();
  readonly nodes: CommentMoon[] = [];
  private geo = new THREE.SphereGeometry(1, 16, 16);

  constructor(comments: CommentNode[], center: THREE.Vector3) {
    comments.slice(0, 24).forEach((c, i) => {
      const moon = new CommentMoon(c, center, i, this.geo);
      this.nodes.push(moon);
      this.group.add(moon.object);
    });
  }

  byId(id: string): CommentMoon | undefined {
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
