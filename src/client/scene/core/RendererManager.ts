import * as THREE from 'three';

// Owns the WebGL renderer and its colour/shadow pipeline. ACES tone mapping and
// soft shadow maps are what make the cosmos read as rendered rather than flat.
export class RendererManager {
  readonly renderer: THREE.WebGLRenderer;

  constructor(parent: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    // Cap DPR: bloom + shadows are fragment-heavy, and 1.75 is visually
    // indistinguishable from native retina here while costing far less.
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.setClearColor(0x02040a, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // Slightly under 1.0 keeps highlights from clipping, so emissives bloom
    // rather than blow out — a cooler, more expensive falloff into the void.
    this.renderer.toneMappingExposure = 0.98;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    parent.appendChild(this.renderer.domElement);
  }

  get domElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  resize(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
  }

  dispose(): void {
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
