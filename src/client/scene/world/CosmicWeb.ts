import * as THREE from 'three';

// Thin luminous filaments connecting nearby galaxy centers — the large-scale
// structure of the cosmos made visible. Line pairs emitted additively at very low
// opacity so they read as a web of light, not a wireframe. Built once from the
// galaxy positions; no runtime updates needed.
export class CosmicWeb {
  readonly group = new THREE.Group();
  private readonly geo: THREE.BufferGeometry;
  private readonly mat: THREE.LineBasicMaterial;

  constructor(positions: THREE.Vector3[], connectRadius = 130) {
    const pts: number[] = [];
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (positions[i].distanceTo(positions[j]) < connectRadius) {
          pts.push(
            positions[i].x, positions[i].y, positions[i].z,
            positions[j].x, positions[j].y, positions[j].z,
          );
        }
      }
    }

    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));

    this.mat = new THREE.LineBasicMaterial({
      color: 0x27c4d9,
      transparent: true,
      opacity: 0.09,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.group.add(new THREE.LineSegments(this.geo, this.mat));
  }

  dispose(): void {
    this.geo.dispose();
    this.mat.dispose();
    this.group.clear();
  }
}
