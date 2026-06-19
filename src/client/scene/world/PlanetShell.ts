import * as THREE from 'three';
import { createMembraneMaterial, COLOR } from '../../../design-system/index.js';
import type { Raycastable, SelectionPayload, FocusFrame } from '../raycastable.js';

// The Reddit cosmos core: a dark PBR sphere that catches the rim light and env
// reflections, wrapped in a faint translucent membrane and a thin vascular
// wireframe. Raycastable as 'planet' so the breadcrumb can always surface home.
export const PLANET_RADIUS = 120;

export class PlanetShell implements Raycastable {
  readonly object = new THREE.Group();
  readonly payload: SelectionPayload = { kind: 'planet', id: 'reddit', label: 'Reddit' };
  private membrane: THREE.ShaderMaterial;

  constructor() {
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(PLANET_RADIUS * 0.97, 5),
      new THREE.MeshStandardMaterial({
        color: COLOR.abyss, metalness: 0.6, roughness: 0.42,
        emissive: COLOR.navy, emissiveIntensity: 0.5,
      }),
    );
    core.castShadow = true;
    core.receiveShadow = true;

    this.membrane = createMembraneMaterial({ color: COLOR.navy, rimColor: COLOR.accent, opacity: 0.04 });
    const skin = new THREE.Mesh(new THREE.IcosahedronGeometry(PLANET_RADIUS, 6), this.membrane);

    const veins = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(PLANET_RADIUS * 1.01, 2)),
      new THREE.LineBasicMaterial({ color: COLOR.accent, transparent: true, opacity: 0.1 }),
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
