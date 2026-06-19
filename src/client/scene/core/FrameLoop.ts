// A single requestAnimationFrame loop. Subsystems subscribe; nobody else owns
// a raf. Delta is clamped so a backgrounded tab never produces a huge jump.
export type Tick = (dt: number, elapsed: number) => void;

export class FrameLoop {
  private subs = new Set<Tick>();
  private raf = 0;
  private last = 0;
  private elapsed = 0;
  private running = false;

  add(fn: Tick): () => void {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private loop = (now: number): void => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.elapsed += dt;
    for (const fn of this.subs) fn(dt, this.elapsed);
    this.raf = requestAnimationFrame(this.loop);
  };
}
