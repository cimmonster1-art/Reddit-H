// A single requestAnimationFrame loop. Subsystems subscribe; nobody else owns
// a raf. Delta is clamped so a backgrounded tab never produces a huge jump, and
// the loop is capped to a target FPS so the bloom + shadow pipeline never pins
// the GPU at the display's full refresh rate.
export type Tick = (dt: number, elapsed: number) => void;

export class FrameLoop {
  private subs = new Set<Tick>();
  private raf = 0;
  private last = 0;
  private elapsed = 0;
  private running = false;
  private readonly interval: number;

  constructor(maxFps = 40) {
    this.interval = 1000 / maxFps;
  }

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
    this.raf = requestAnimationFrame(this.loop);
    // Throttle to the target frame interval; skip the rest of this rAF tick.
    const since = now - this.last;
    if (since < this.interval) return;
    const dt = Math.min(0.05, since / 1000);
    this.last = now;
    this.elapsed += dt;
    for (const fn of this.subs) fn(dt, this.elapsed);
  };
}
