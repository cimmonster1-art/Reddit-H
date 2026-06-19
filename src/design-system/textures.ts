import * as THREE from 'three';

// Procedural canvas textures — borrowed from Bio-Galaxy and re-tuned for the
// substrataaa cold palette. All returned textures are owned by the caller.

/** Soft radial glow — used for galaxy halos and node sprites. */
export function createGlowTexture(size = 128): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const c = size / 2;
    const g = ctx.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0,    'rgba(255,255,255,1)');
    g.addColorStop(0.22, 'rgba(255,255,255,0.72)');
    g.addColorStop(0.52, 'rgba(255,255,255,0.18)');
    g.addColorStop(1,    'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

/** 4-point diffraction star — used for thread-star instances and point fields. */
export function createStarTexture(size = 64): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const c = size / 2;
    const core = ctx.createRadialGradient(c, c, 0, c, c, c);
    core.addColorStop(0,    'rgba(255,255,255,1)');
    core.addColorStop(0.18, 'rgba(255,255,255,0.85)');
    core.addColorStop(0.44, 'rgba(255,255,255,0.22)');
    core.addColorStop(1,    'rgba(255,255,255,0)');
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, size, size);
    ctx.globalCompositeOperation = 'lighter';
    const lw = Math.max(1, size / 96);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI;
      const len = c * 0.88;
      const grad = ctx.createLinearGradient(
        c - Math.cos(a) * len, c - Math.sin(a) * len,
        c + Math.cos(a) * len, c + Math.sin(a) * len,
      );
      grad.addColorStop(0,   'rgba(255,255,255,0)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.55)');
      grad.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(c - Math.cos(a) * len, c - Math.sin(a) * len);
      ctx.lineTo(c + Math.cos(a) * len, c + Math.sin(a) * len);
      ctx.stroke();
    }
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}
