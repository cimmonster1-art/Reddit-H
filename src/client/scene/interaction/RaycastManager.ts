import * as THREE from 'three';
import type { Raycastable } from '../raycastable.js';

// Maps screen rays to registered Raycastables. Descendants of each root are
// tagged so a hit on any child resolves back to its owning Raycastable.
export class RaycastManager {
  private raycaster = new THREE.Raycaster();
  private meshes: THREE.Object3D[] = [];

  constructor(private camera: THREE.Camera) {}

  register(r: Raycastable): void {
    r.object.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.userData.__ray = r;
        this.meshes.push(o);
      }
    });
  }

  unregister(r: Raycastable): void {
    this.meshes = this.meshes.filter((o) => o.userData.__ray !== r);
  }

  clear(): void { this.meshes = []; }

  /** ndc: normalized device coords in [-1,1]. Returns nearest owner or null. */
  pick(ndc: THREE.Vector2): Raycastable | null {
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.meshes, false);
    for (const h of hits) {
      const owner = h.object.userData.__ray as Raycastable | undefined;
      if (owner) return owner;
    }
    return null;
  }
}
