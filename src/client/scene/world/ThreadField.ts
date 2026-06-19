import * as THREE from 'three';
import { VITAL_COLOR } from '../../game/palette.js';
import type { Raycastable, SelectionPayload, FocusFrame } from '../raycastable.js';
import type { Organ } from '../../../shared/types.js';

// The home galaxy's posts as star-bodies, laid out from their deterministic u/v
// and coloured by vital state. Shadowed PBR so they sit in the same rendered
// light as everything else. Built lazily around a galaxy's world-space centre
// when the camera dives in; hidden otherwise.
class ThreadNode implements Raycastable {
  readonly object = new THREE.Group();
  readonly payload: SelectionPayload;
  private base: number;

  constructor(readonly organ: Organ, center: THREE.Vector3) {
    const color = VITAL_COLOR[organ.state] ?? 0x99a8ff;
    this.base = 1.4 + Math.log10(1 + organ.lift) * 1.2;
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 2),
      new THREE.MeshStandardMaterial({
        color, metalness: 0.2, roughness: 0.5,
        emissive: color, emissiveIntensity: 0.25 + organ.oxygen * 0.5,
      }),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.object.add(mesh);
    const spread = 14;
    this.object.position.set(
      center.x + (organ.u - 0.5) * spread,
      center.y + (organ.v - 0.5) * spread,
      center.z + Math.sin(organ.u * 6.28) * 2,
    );
    this.object.scale.setScalar(this.base);
    this.payload = { kind: 'thread', id: organ.id, label: organ.title, data: organ };
  }

  focus(): FocusFrame {
    return { center: this.object.position.clone(), radius: this.base * 3 };
  }
}

export class ThreadField {
  readonly group = new THREE.Group();
  readonly nodes: ThreadNode[] = [];

  constructor(organs: Organ[], center: THREE.Vector3) {
    for (const o of organs.slice(0, 40)) {
      const node = new ThreadNode(o, center);
      this.nodes.push(node);
      this.group.add(node.object);
    }
    this.group.visible = false;
  }

  setVisible(v: boolean): void { this.group.visible = v; }

  update(dt: number, elapsed: number): void {
    if (!this.group.visible) return;
    for (const n of this.nodes) n.object.rotation.y += dt * 0.4;
    this.group.position.y = Math.sin(elapsed * 0.6) * 0.2;
  }
}
