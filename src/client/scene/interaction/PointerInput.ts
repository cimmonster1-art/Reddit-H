import * as THREE from 'three';

// Translates pointer events into NDC hover + click intents. A move past a small
// threshold (i.e. an orbit drag) suppresses the click so camera control and
// selection never fight. Camera drag is handled separately in CameraController.
export interface PointerHandlers {
  onHover?: (ndc: THREE.Vector2) => void;
  onClick?: (ndc: THREE.Vector2) => void;
}

export class PointerInput {
  private ndc = new THREE.Vector2();
  private downX = 0;
  private downY = 0;
  private moved = false;

  constructor(private dom: HTMLElement, private handlers: PointerHandlers) {}

  attach(): void {
    this.dom.addEventListener('pointerdown', this.onDown);
    this.dom.addEventListener('pointermove', this.onMove);
    this.dom.addEventListener('pointerup', this.onUp);
  }

  detach(): void {
    this.dom.removeEventListener('pointerdown', this.onDown);
    this.dom.removeEventListener('pointermove', this.onMove);
    this.dom.removeEventListener('pointerup', this.onUp);
  }

  private toNdc(e: PointerEvent): THREE.Vector2 {
    this.ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    return this.ndc;
  }

  private onDown = (e: PointerEvent): void => {
    this.downX = e.clientX; this.downY = e.clientY; this.moved = false;
  };
  private onMove = (e: PointerEvent): void => {
    if (Math.hypot(e.clientX - this.downX, e.clientY - this.downY) > 6) this.moved = true;
    this.handlers.onHover?.(this.toNdc(e));
  };
  private onUp = (e: PointerEvent): void => {
    if (!this.moved) this.handlers.onClick?.(this.toNdc(e));
  };
}
