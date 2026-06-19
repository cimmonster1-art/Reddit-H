import * as THREE from 'three';
import { RendererManager } from './RendererManager.js';
import { FrameLoop } from './FrameLoop.js';

// Owns the scene graph root, the camera, the renderer and the frame loop, and
// renders once per tick. Higher layers add content; this file knows nothing
// about organisms or Reddit.
export class SceneRoot {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: RendererManager;
  readonly loop = new FrameLoop();

  constructor(parent: HTMLElement) {
    this.renderer = new RendererManager(parent);
    this.camera = new THREE.PerspectiveCamera(
      50, window.innerWidth / window.innerHeight, 0.1, 5000,
    );
    this.camera.position.set(0, 0, 520);
    this.addLights();
    this.loop.add(() => this.renderer.renderer.render(this.scene, this.camera));
    window.addEventListener('resize', this.onResize);
  }

  private addLights(): void {
    this.scene.add(new THREE.AmbientLight(0x223055, 1.1));
    const key = new THREE.PointLight(0xaee3ff, 1.4, 0, 1.5);
    key.position.set(220, 160, 320);
    const rim = new THREE.PointLight(0x7c8cff, 0.9, 0, 1.6);
    rim.position.set(-260, -120, -200);
    this.scene.add(key, rim);
  }

  private onResize = (): void => {
    this.renderer.resize();
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  };

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.loop.stop();
    this.renderer.dispose();
  }
}
