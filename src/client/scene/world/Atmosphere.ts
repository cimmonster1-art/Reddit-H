import * as THREE from 'three';
import { createNebulaBackground } from '../../../design-system/index.js';

// The deep-space backdrop + a faint breathing oxygen haze. Drives its shader
// time from the frame loop. No interactivity.
export class Atmosphere {
  readonly group = new THREE.Group();
  private material: THREE.ShaderMaterial;

  constructor() {
    const { mesh, material } = createNebulaBackground({ radius: 2400 });
    this.material = material;
    this.group.add(mesh);
  }

  update(_dt: number, elapsed: number): void {
    this.material.uniforms.uTime.value = elapsed;
    this.group.rotation.y = elapsed * 0.005;
  }
}
