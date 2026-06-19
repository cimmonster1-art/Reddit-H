import type { WorldState } from '../../shared/types.js';
import type { ZoomLevel, Crumb } from '../scene/camera/ZoomController.js';

// The persistent cold chrome: identity strip, metabolism readout and the
// zoom-ladder breadcrumb. Reads the DOM in index.html; emits surface requests
// when a breadcrumb rung is clicked. Flat hairline styling lives in style.css.
const LEVEL_LABEL: Record<ZoomLevel, string> = {
  planet: 'Cosmos', biome: 'Galaxy', thread: 'Star', comment: 'Orbit', reply: 'Moon',
};

export class Hud {
  constructor(private onSurface: (index: number) => void) {}

  mount(world: WorldState): void {
    this.show('topbar');
    this.show('zoombar');
    const brand = document.querySelector('.brand-name');
    if (brand) brand.textContent = `SUBSTRATE · r/${world.subreddit}`;
    const m = world.metabolism;
    const el = document.getElementById('metabolism');
    if (el) el.innerHTML =
      stat('light', fmt(m.oxygen)) + stat('fuel', fmt(m.bloodflow)) + stat('signal', fmt(m.nerves));
    document.getElementById('loader')?.setAttribute('hidden', '');
  }

  setZoom(_level: ZoomLevel, crumbs: Crumb[]): void {
    const bar = document.getElementById('zoombar');
    if (!bar) return;
    bar.innerHTML = crumbs
      .map((c, i) => `<button data-i="${i}" class="${i === crumbs.length - 1 ? 'active' : ''}">${LEVEL_LABEL[c.level]}</button>`)
      .join('<span class="sep">/</span>');
    for (const b of Array.from(bar.querySelectorAll('button'))) {
      b.addEventListener('click', () => this.onSurface(Number((b as HTMLElement).dataset.i)));
    }
  }

  private show(id: string): void {
    document.getElementById(id)?.removeAttribute('hidden');
  }
}

function stat(label: string, value: string): string {
  return `<span class="mv"><i>${label}</i><b>${value}</b></span>`;
}

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return String(Math.round(n));
}
