import * as THREE from 'three';

// Smooth orbital camera with pointer-drag rotation and wheel/pinch dolly.
// Exposes frameOn() so the ZoomController can dolly to any focus frame.
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const damp = (a: number, b: number, l: number, dt: number) =>
  a + (b - a) * (1 - Math.exp(-l * dt));

export class CameraController {
  private target = new THREE.Vector3();
  private desiredTarget = new THREE.Vector3();
  private azimuth = 0.6;
  private polar = Math.PI / 2.2;
  private distance = 520;
  private desiredDistance = 520;
  private dragging = false;
  private lx = 0;
  private ly = 0;
  private idle = 0; // seconds since the last user interaction
  minDistance = 6;
  maxDistance = 1600;

  constructor(private camera: THREE.PerspectiveCamera, private dom: HTMLElement) {}

  attach(): void {
    this.dom.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointermove', this.onMove);
    this.dom.addEventListener('wheel', this.onWheel, { passive: false });
  }

  detach(): void {
    this.dom.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointermove', this.onMove);
    this.dom.removeEventListener('wheel', this.onWheel);
  }

  frameOn(center: THREE.Vector3, radius: number): void {
    this.desiredTarget.copy(center);
    this.desiredDistance = clamp(radius * 2.6, this.minDistance, this.maxDistance);
  }

  update(dt: number): void {
    // Cinematic, unhurried easing toward the framed target.
    this.distance = damp(this.distance, this.desiredDistance, 2.8, dt);
    this.target.lerp(this.desiredTarget, 1 - Math.exp(-2.8 * dt));

    // After a few seconds of stillness, the cosmos slowly turns itself — a
    // living drift that eases in so it never yanks the moment a drag ends.
    this.idle += dt;
    if (!this.dragging && this.idle > 3) {
      const ramp = Math.min(1, (this.idle - 3) / 4);
      this.azimuth += dt * 0.035 * ramp;
    }

    const sp = Math.sin(this.polar);
    const x = this.target.x + this.distance * sp * Math.sin(this.azimuth);
    const y = this.target.y + this.distance * Math.cos(this.polar);
    const z = this.target.z + this.distance * sp * Math.cos(this.azimuth);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.target);
  }

  private onDown = (e: PointerEvent): void => {
    this.dragging = true;
    this.idle = 0;
    this.lx = e.clientX;
    this.ly = e.clientY;
  };
  private onUp = (): void => { this.dragging = false; this.idle = 0; };
  private onMove = (e: PointerEvent): void => {
    if (!this.dragging) return;
    this.idle = 0;
    this.azimuth -= (e.clientX - this.lx) * 0.005;
    this.polar = clamp(this.polar - (e.clientY - this.ly) * 0.005, 0.25, Math.PI - 0.25);
    this.lx = e.clientX;
    this.ly = e.clientY;
  };
  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this.idle = 0;
    this.desiredDistance = clamp(
      this.desiredDistance * (1 + Math.sign(e.deltaY) * 0.12),
      this.minDistance, this.maxDistance,
    );
  };
}
