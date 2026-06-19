import * as THREE from 'three';
import { RendererManager } from './RendererManager.js';
import { FrameLoop } from './FrameLoop.js';
import { LightingRig } from './LightingRig.js';
import { PostFX } from './PostFX.js';
import { createStudioEnvironment } from './environment.js';

// Owns the scene graph root, camera, renderer, lighting, environment, fog and
// the post-processed frame loop. Higher layers add content; this file knows
// nothing about cosmos, galaxies or Reddit.
export class SceneRoot {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: RendererManager;
  readonly loop = new FrameLoop();
  private lighting: LightingRig;
  private postfx: PostFX;
  private env: THREE.Texture;

  constructor(parent: HTMLElement) {
    this.renderer = new RendererManager(parent);
    this.scene.fog = new THREE.FogExp2(0x02040a, 0.0011);
    this.env = createStudioEnvironment(this.renderer.renderer);
    this.scene.environment = this.env;

    this.camera = new THREE.PerspectiveCamera(
      50, window.innerWidth / window.innerHeight, 0.1, 5000,
    );
    this.camera.position.set(0, 0, 520);

    this.lighting = new LightingRig(this.scene);
    this.postfx = new PostFX(
      this.renderer.renderer, this.scene, this.camera,
      window.innerWidth, window.innerHeight,
    );
    this.loop.add(() => this.postfx.render());
    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  private onResize = (): void => {
    this.renderer.resize();
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.postfx.setSize(window.innerWidth, window.innerHeight);
  };

  // Stop the render loop entirely while the post is off-screen so a backgrounded
  // tab costs zero GPU.
  private onVisibility = (): void => {
    if (document.hidden) this.loop.stop();
    else this.loop.start();
  };

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.loop.stop();
    this.lighting.dispose();
    this.postfx.dispose();
    this.scene.environment = null;
    this.env.dispose();
    this.renderer.dispose();
  }
}
