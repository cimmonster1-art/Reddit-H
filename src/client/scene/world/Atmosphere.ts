import * as THREE from 'three';
import { createNebulaBackground } from '../../../design-system/index.js';
import { StormLayer } from './StormLayer.js';
import type { Storm } from '../../../shared/types.js';

// The deep-space backdrop + a faint breathing oxygen haze. Drives its shader
// time from the frame loop. Storm vortices are layered on after world load.
export class Atmosphere {
  readonly group = new THREE.Group();
  private material: THREE.ShaderMaterial;
  private storms: StormLayer | null = null;

  constructor() {
    const { mesh, material } = createNebulaBackground({ radius: 2400 });
    this.material = material;
    this.group.add(mesh);
  }

  /** Layer in real controversial-thread storm clouds once the world loads. */
  setStorms(data: Storm[]): void {
    if (this.storms) {
      this.group.remove(this.storms.group);
      this.storms.dispose();
    }
    this.storms = new StormLayer(data);
    this.group.add(this.storms.group);
  }

  update(_dt: number, elapsed: number): void {
    this.material.uniforms.uTime.value = elapsed;
    this.group.rotation.y = elapsed * 0.005;
    this.storms?.update(_dt, elapsed);
  }
}
