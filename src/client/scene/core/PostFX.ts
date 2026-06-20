import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// Post pipeline shared by the whole cosmos: an HDR multisampled target for
// clean edges and bloom headroom, a restrained bloom for genuinely bright
// emissive bodies, a gentle vignette to pull the eye inward, and an OutputPass
// applying ACES tone mapping + colour management once. Disposes its targets.
export class PostFX {
  private readonly composer: EffectComposer;
  private readonly bloom: UnrealBloomPass;
  private readonly target: THREE.WebGLRenderTarget;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    width: number,
    height: number,
  ) {
    const dpr = renderer.getPixelRatio();
    const samples = renderer.capabilities.isWebGL2 ? 4 : 0;
    this.target = new THREE.WebGLRenderTarget(
      Math.max(1, Math.floor(width * dpr)),
      Math.max(1, Math.floor(height * dpr)),
      { type: THREE.HalfFloatType, samples },
    );
    this.composer = new EffectComposer(renderer, this.target);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(width, height);
    this.composer.addPass(new RenderPass(scene, camera));

    // Selective, soft bloom: a higher threshold means only genuinely bright
    // cores bloom, and a wider radius spreads them into an expensive haze
    // rather than a hot ring.
    this.bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.42, 0.85, 0.86);
    this.composer.addPass(this.bloom);

    // A deeper, tighter vignette frames the cosmos like a lens.
    const vignette = new ShaderPass(VignetteShader);
    vignette.uniforms.offset.value = 0.92;
    vignette.uniforms.darkness.value = 1.28;
    this.composer.addPass(vignette);

    this.composer.addPass(new OutputPass());
  }

  render(): void { this.composer.render(); }

  setSize(width: number, height: number): void {
    this.composer.setSize(width, height);
    this.bloom.setSize(width, height);
  }

  dispose(): void {
    this.bloom.dispose();
    this.target.dispose();
    this.composer.dispose();
  }
}
