import * as THREE from 'three';

// Cold lighting rig. A cool ambient fill, a hemisphere bounce, a shadow-casting
// key, a restrained warm for dimensionality, and a teal rim/fill give surfaces
// soft volumetric shading that reads as expensive without washing out the void.
// Owns its lights and removes them on teardown.
export class LightingRig {
  private readonly group = new THREE.Group();

  constructor(scene: THREE.Scene) {
    this.group.name = 'LightingRig';
    this.group.add(new THREE.AmbientLight(0x3a5a78, 0.36));
    this.group.add(new THREE.HemisphereLight(0x9fd4ff, 0x0a1622, 0.42));

    const key = new THREE.DirectionalLight(0xcfeaff, 1.3);
    key.position.set(180, 240, 140);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 900;
    key.shadow.camera.left = -220;
    key.shadow.camera.right = 220;
    key.shadow.camera.top = 220;
    key.shadow.camera.bottom = -220;
    key.shadow.bias = -0.0004;
    key.shadow.radius = 4;
    this.group.add(key);

    // A small warm keeps the cold scene from going sterile and monochrome.
    const warm = new THREE.DirectionalLight(0xffd9a0, 0.22);
    warm.position.set(-160, 60, -120);
    this.group.add(warm);

    const rim = new THREE.PointLight(0x27c4d9, 0.42, 1400, 1.6);
    rim.position.set(-200, -100, 160);
    this.group.add(rim);

    const fill = new THREE.PointLight(0x12324a, 0.55, 1200, 1.8);
    fill.position.set(220, -140, -180);
    this.group.add(fill);

    scene.add(this.group);
  }

  dispose(): void {
    this.group.parent?.remove(this.group);
    this.group.clear();
  }
}
