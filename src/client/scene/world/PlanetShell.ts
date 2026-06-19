import * as THREE from 'three';
import { createMembraneMaterial, COLOR } from '../../../design-system/index.js';
import type { Raycastable, SelectionPayload, FocusFrame } from '../raycastable.js';

// The Reddit organism itself: a dark translucent core wrapped in a Fresnel
// membrane and a faint vascular wireframe. Raycastable as the 'planet' so the
// breadcrumb can always surface back to the whole world.
export const PLANET_RADIUS = 120;

export class PlanetShell implements Raycastable {
  readonly object = new THREE.Group();
  readonly payload: SelectionPayload = { kind: 'planet', id: 'reddit', label: 'Reddit' };
  private membrane: THREE.ShaderMaterial;

  constructor() {
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(PLANET_RADIUS * 0.97, 4),
      new THREE.MeshStandardMaterial({ color: COLOR.void1, roughness: 0.9, metalness: 0.1, emissive: COLOR.crust, emissiveIntensity: 0.25 }),
    );
    this.membrane = createMembraneMaterial({ color: COLOR.nerve, rimColor: COLOR.oxygen, opacity: 0.05 });
    const skin = new THREE.Mesh(new THREE.IcosahedronGeometry(PLANET_RADIUS, 5), this.membrane);
    const veins = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(PLANET_RADIUS * 1.01, 2)),
      new THREE.LineBasicMaterial({ color: COLOR.accent, transparent: true, opacity: 0.12 }),
    );
    this.object.add(core, skin, veins);
  }

  focus(): FocusFrame {
    return { center: new THREE.Vector3(0, 0, 0), radius: PLANET_RADIUS * 1.7 };
  }

  update(_dt: number, elapsed: number): void {
    this.membrane.uniforms.uTime.value = elapsed;
    this.object.rotation.y = elapsed * 0.03;
  }
}
