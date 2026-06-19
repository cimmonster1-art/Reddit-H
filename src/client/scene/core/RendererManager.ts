import * as THREE from 'three';

/** Owns the WebGL renderer and keeps it sized to the viewport. One job. */
export class RendererManager {
  readonly renderer: THREE.WebGLRenderer;

  constructor(parent: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true, alpha: true, powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    parent.appendChild(this.renderer.domElement);
    this.resize();
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
