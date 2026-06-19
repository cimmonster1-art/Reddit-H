import type { WorldState } from '../../shared/types.js';
import type { ZoomLevel, Crumb } from '../scene/camera/ZoomController.js';
import { FOUNDATIONAL_BIOMES } from '../world/foundational.js';

// Drives the left panel (brand + live stats + sparkline) and the bottom
// breadcrumb bar. No glass, no cards — cold instrument readout only.
const LEVEL_LABEL: Record<ZoomLevel, string> = {
  planet: 'Cosmos', biome: 'Galaxy', thread: 'Star', comment: 'Orbit', reply: 'Moon',
};

export class Hud {
  private world: WorldState | null = null;

  constructor(private onSurface: (index: number) => void) {}

  mount(world: WorldState): void {
    this.world = world;
    this.show('panel-left');
    this.show('zoombar');
    document.getElementById('loader')?.setAttribute('hidden', '');
    this.renderStats(world);
    this.renderSparkline(world);
  }

  setZoom(_level: ZoomLevel, crumbs: Crumb[]): void {
    const row = document.getElementById('crumb-row');
    if (!row) return;
    const world = this.world;
    row.innerHTML = crumbs.map((c, i) => {
      const active = i === crumbs.length - 1 ? 'active' : '';
      const count = world ? crumbCount(c.level, world) : '';
      return `<button data-i="${i}" class="${active}">${LEVEL_LABEL[c.level]}<span class="crumb-count">${count}</span></button>`;
    }).join('');
    for (const b of Array.from(row.querySelectorAll('button'))) {
      b.addEventListener('click', () => this.onSurface(Number((b as HTMLElement).dataset.i)));
    }
  }

  private renderStats(w: WorldState): void {
    const totalMoons = w.organs.reduce((s, o) => s + o.nerves, 0);
    const rows: [string, string, boolean][] = [
      ['GALAXIES', fmt(FOUNDATIONAL_BIOMES.length), false],
      ['STARS',    fmt(w.organs.length),             false],
      ['MOONS',    fmt(totalMoons),                  false],
      ['LIGHT',    fmt(w.metabolism.oxygen),          false],
      ['FUEL',     fmt(w.metabolism.bloodflow),       false],
      ['SIGNAL',   fmt(w.metabolism.nerves),          true],
    ];
    const el = document.getElementById('stat-list');
    if (el) el.innerHTML = rows.map(([l, v, accent]) =>
      `<li><span class="sl">${l}</span><span class="sv${accent ? ' accent' : ''}">${v}</span></li>`,
    ).join('');
  }

  private renderSparkline(w: WorldState): void {
    const canvas = document.getElementById('sparkline') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    // Fake 24-point activity curve seeded from real bloodflow + noise.
    const pts = Array.from({ length: 24 }, (_, i) => {
      const base = w.metabolism.bloodflow;
      const seed = Math.sin(i * 1.618 + w.seed) * 0.5 + 0.5;
      const spike = i === 14 || i === 20 ? 0.85 : 0;
      return Math.min(1, seed * 0.6 + spike + (base > 0 ? 0.15 : 0));
    });
    const max = Math.max(...pts, 0.01);
    const step = W / (pts.length - 1);

    ctx.clearRect(0, 0, W, H);
    ctx.beginPath();
    pts.forEach((v, i) => {
      const x = i * step;
      const y = H - (v / max) * (H - 4) - 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#27c4d9';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Fill under curve.
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(39,196,217,0.22)');
    grad.addColorStop(1, 'rgba(39,196,217,0)');
    ctx.fillStyle = grad;
    ctx.fill();
  }

  private show(id: string): void { document.getElementById(id)?.removeAttribute('hidden'); }
}

function crumbCount(level: ZoomLevel, w: WorldState): string {
  if (level === 'planet')  return fmt(FOUNDATIONAL_BIOMES.length);
  if (level === 'thread')  return fmt(w.organs.length);
  if (level === 'comment') return fmt(w.organs.reduce((s, o) => s + o.nerves, 0));
  return '∞';
}

function fmt(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'b';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'm';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return String(Math.round(n));
}
