import type { WorldState } from '../../shared/types.js';
import type { ZoomLevel, Crumb } from '../scene/camera/ZoomController.js';

// Owns the persistent glass chrome: identity strip, metabolism readout and the
// zoom-ladder bar / breadcrumb. Reads the DOM declared in index.html; emits
// surface requests when a breadcrumb rung is clicked.
const LEVEL_LABEL: Record<ZoomLevel, string> = {
  planet: 'Planet', biome: 'Biome', thread: 'Thread', comment: 'Comment', reply: 'Reply',
};

export class Hud {
  constructor(private onSurface: (index: number) => void) {}

  mount(world: WorldState): void {
    this.show('topbar'); this.show('zoombar');
    const brand = document.querySelector('.brand-name');
    if (brand) brand.textContent = `SUBSTRATE · r/${world.subreddit}`;
    const m = world.metabolism;
    const el = document.getElementById('metabolism');
    if (el) el.innerHTML =
      `<span class="m-ox">oxygen <b>${fmt(m.oxygen)}</b></span>` +
      `<span class="m-li">lift <b>${fmt(m.bloodflow)}</b></span>` +
      `<span class="m-ne">nerves <b>${fmt(m.nerves)}</b></span>`;
    document.getElementById('loader')?.setAttribute('hidden', '');
  }

  setZoom(level: ZoomLevel, crumbs: Crumb[]): void {
    const bar = document.getElementById('zoombar');
    if (!bar) return;
    bar.innerHTML = crumbs
      .map((c, i) => `<button data-i="${i}" class="${i === crumbs.length - 1 ? 'active' : ''}">${LEVEL_LABEL[c.level]}</button>`)
      .join('');
    for (const b of Array.from(bar.querySelectorAll('button'))) {
      b.addEventListener('click', () => this.onSurface(Number((b as HTMLElement).dataset.i)));
    }
    void level;
  }

  private show(id: string): void {
    document.getElementById(id)?.removeAttribute('hidden');
  }
}

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return String(Math.round(n));
}
