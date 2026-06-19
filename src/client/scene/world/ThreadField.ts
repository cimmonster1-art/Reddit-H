import * as THREE from 'three';
import { createSpriteLabel, disposeSpriteLabel } from '../../../design-system/index.js';
import { VITAL_COLOR } from '../../game/palette.js';
import type { Raycastable, SelectionPayload, FocusFrame } from '../raycastable.js';
import type { Organ } from '../../../shared/types.js';

const LABELLED = 6; // brightest posts that carry a floating title

// The home galaxy's posts as star-bodies, laid out from their deterministic u/v
// and coloured by vital state. Shadowed PBR so they sit in the same rendered
// light as everything else. Built lazily around a galaxy's world-space centre
// when the camera dives in; hidden otherwise.
class ThreadNode implements Raycastable {
  readonly object = new THREE.Group();
  readonly payload: SelectionPayload;
  private base: number;
  private mesh: THREE.Mesh;
  private label: THREE.Sprite | null = null;

  constructor(readonly organ: Organ, center: THREE.Vector3) {
    const color = VITAL_COLOR[organ.state] ?? 0x99a8ff;
    this.base = 1.4 + Math.log10(1 + organ.lift) * 1.2;
    this.mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 2),
      new THREE.MeshStandardMaterial({
        color, metalness: 0.2, roughness: 0.5,
        emissive: color, emissiveIntensity: 0.25 + organ.oxygen * 0.5,
      }),
    );
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.object.add(this.mesh);
    const spread = 14;
    this.object.position.set(
      center.x + (organ.u - 0.5) * spread,
      center.y + (organ.v - 0.5) * spread,
      center.z + Math.sin(organ.u * 6.28) * 2,
    );
    this.object.scale.setScalar(this.base);
    this.payload = { kind: 'thread', id: organ.id, label: organ.title, data: organ };
  }

  // Float a truncated post title above the brightest stars so a galaxy reads as
  // real posts, not anonymous lights. Local-space y rides the node's scale.
  showLabel(): void {
    if (this.label) return;
    this.label = createSpriteLabel(truncate(this.organ.title), '#cdd9e8', 0.034);
    this.label.position.set(0, 1.9, 0);
    this.object.add(this.label);
  }

  focus(): FocusFrame {
    return { center: this.object.position.clone(), radius: this.base * 3 };
  }

  dispose(): void {
    if (this.label) {
      this.object.remove(this.label);
      disposeSpriteLabel(this.label);
      this.label = null;
    }
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

function truncate(s: string): string {
  return s.length > 42 ? `${s.slice(0, 41)}…` : s;
}

export class ThreadField {
  readonly group = new THREE.Group();
  readonly nodes: ThreadNode[] = [];

  constructor(organs: Organ[], center: THREE.Vector3) {
    const shown = organs.slice(0, 40);
    for (const o of shown) {
      const node = new ThreadNode(o, center);
      this.nodes.push(node);
      this.group.add(node.object);
    }
    // Name only the brightest posts (by lift) so titles guide without clutter.
    [...this.nodes]
      .sort((a, b) => b.organ.lift - a.organ.lift)
      .slice(0, LABELLED)
      .forEach((n) => n.showLabel());
    this.group.visible = false;
  }

  setVisible(v: boolean): void { this.group.visible = v; }

  update(dt: number, elapsed: number): void {
    if (!this.group.visible) return;
    for (const n of this.nodes) n.object.rotation.y += dt * 0.4;
    this.group.position.y = Math.sin(elapsed * 0.6) * 0.2;
  }

  dispose(): void {
    for (const n of this.nodes) n.dispose();
    this.group.clear();
  }
}
