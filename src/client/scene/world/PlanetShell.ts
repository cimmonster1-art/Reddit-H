import * as THREE from 'three';
import { createMembraneMaterial, COLOR } from '../../../design-system/index.js';
import { FossilLayer } from './FossilLayer.js';
import type { Raycastable, SelectionPayload, FocusFrame } from '../raycastable.js';
import type { Fossil, MoonState } from '../../../shared/types.js';

// The Reddit cosmos core: a dark PBR sphere that catches the rim light and env
// reflections, wrapped in a faint translucent membrane and a thin vascular
// wireframe. Raycastable as 'planet' so the breadcrumb can always surface home.
export const PLANET_RADIUS = 120;

// A single moon that orbits the planet; its appearance reflects the community's
// comment-activity MoonState (asleep → cracked → glowing → hatched).
class PlanetMoon {
  readonly object = new THREE.Group();
  private mat: THREE.MeshStandardMaterial;
  private auraMat: THREE.MeshStandardMaterial;
  private auraBaseOpacity = 0;

  constructor() {
    this.mat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e, metalness: 0.32, roughness: 0.6,
      emissive: new THREE.Color(0x000000), emissiveIntensity: 0,
    });
    const geo = new THREE.IcosahedronGeometry(PLANET_RADIUS * 0.082, 3);
    const mesh = new THREE.Mesh(geo, this.mat);

    this.auraMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xffd700), emissive: new THREE.Color(0xffd700),
      emissiveIntensity: 0, transparent: true, opacity: 0, side: THREE.BackSide,
    });
    const aura = new THREE.Mesh(new THREE.IcosahedronGeometry(PLANET_RADIUS * 0.115, 3), this.auraMat);
    this.object.add(mesh, aura);
  }

  setState(state: MoonState): void {
    switch (state) {
      case 'asleep':
        this.mat.color.set(0x1a1a2e);
        this.mat.emissive.set(0x000000);
        this.mat.emissiveIntensity = 0;
        this.auraBaseOpacity = 0;
        break;
      case 'cracked':
        this.mat.color.set(0x22183c);
        this.mat.emissive.set(0x331a55);
        this.mat.emissiveIntensity = 0.12;
        this.auraBaseOpacity = 0;
        break;
      case 'glowing':
        this.mat.color.set(0x36196a);
        this.mat.emissive.set(0x6644cc);
        this.mat.emissiveIntensity = 0.42;
        this.auraMat.color.set(0x6644cc);
        this.auraMat.emissive.set(0x6644cc);
        this.auraMat.emissiveIntensity = 0.28;
        this.auraBaseOpacity = 0.14;
        break;
      case 'hatched':
        this.mat.color.set(0xffd060);
        this.mat.emissive.set(0xffaa00);
        this.mat.emissiveIntensity = 1.15;
        this.auraMat.color.set(0xffcc44);
        this.auraMat.emissive.set(0xffcc44);
        this.auraMat.emissiveIntensity = 0.75;
        this.auraBaseOpacity = 0.32;
        break;
    }
    this.auraMat.opacity = this.auraBaseOpacity;
  }

  update(_dt: number, elapsed: number): void {
    const angle = elapsed * 0.11;
    this.object.position.set(
      Math.cos(angle) * PLANET_RADIUS * 1.52,
      Math.sin(angle * 0.31) * PLANET_RADIUS * 0.32,
      Math.sin(angle) * PLANET_RADIUS * 1.52,
    );
    if (this.auraBaseOpacity > 0.001) {
      this.auraMat.opacity = this.auraBaseOpacity * (0.72 + 0.28 * Math.sin(elapsed * 1.15));
    }
  }
}

export class PlanetShell implements Raycastable {
  readonly object = new THREE.Group();
  readonly payload: SelectionPayload = { kind: 'planet', id: 'reddit', label: 'Reddit' };
  private membrane: THREE.ShaderMaterial;
  private moon = new PlanetMoon();
  private fossils: FossilLayer | null = null;

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
    this.object.add(core, skin, veins, this.moon.object);
  }

  /** Wire real moon lifecycle state from the world digest. */
  setMoon(state: MoonState): void { this.moon.setState(state); }

  /** Embed fossil crystals derived from all-time iconic posts. */
  setFossils(data: Fossil[]): void {
    if (this.fossils) {
      this.object.remove(this.fossils.group);
      this.fossils.dispose();
    }
    this.fossils = new FossilLayer(data);
    this.object.add(this.fossils.group);
  }

  focus(): FocusFrame {
    return { center: new THREE.Vector3(0, 0, 0), radius: PLANET_RADIUS * 1.7 };
  }

  update(_dt: number, elapsed: number): void {
    this.membrane.uniforms.uTime.value = elapsed;
    this.object.rotation.y = elapsed * 0.03;
    this.moon.update(_dt, elapsed);
    this.fossils?.update(_dt, elapsed);
  }
}
