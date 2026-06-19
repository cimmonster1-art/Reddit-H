import * as THREE from 'three';

// Billboard text label drawn from a canvas texture — borrowed from Bio-Galaxy's
// SpriteLabel and re-tuned to the cold palette. Sprites always face the camera;
// with size attenuation off they hold a stable on-screen size at any distance,
// so galaxy names stay legible whether you're at the cosmos or diving a system.
// The caller owns the returned sprite and disposes it via the scene graph.
export function createSpriteLabel(text: string, color = '#aee3ff', height = 0.04): THREE.Sprite {
  const pad = 18;
  const font = 48;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.font = `600 ${font}px "JetBrains Mono", ui-monospace, monospace`;
    const width = ctx.measureText(text).width;
    canvas.width = Math.ceil(width + pad * 2);
    canvas.height = font + pad * 2;
    // Resizing the canvas clears context state, so re-apply it.
    ctx.font = `600 ${font}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(2,4,10,0.9)';
    ctx.shadowBlur = 10;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    sizeAttenuation: false,
    opacity: 0.92,
  });
  const sprite = new THREE.Sprite(material);
  const aspect = canvas.height > 0 ? canvas.width / canvas.height : 4;
  sprite.scale.set(height * aspect, height, 1);
  sprite.renderOrder = 10;
  return sprite;
}

/** Dispose a sprite label's GPU resources (texture + material). */
export function disposeSpriteLabel(sprite: THREE.Sprite): void {
  const mat = sprite.material as THREE.SpriteMaterial;
  mat.map?.dispose();
  mat.dispose();
}
