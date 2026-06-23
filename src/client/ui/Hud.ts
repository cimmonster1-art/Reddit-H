import type { WorldState, AtlasEntry } from '../../shared/types.js';
import type { ZoomLevel, Crumb } from '../scene/camera/ZoomController.js';
import { FOUNDATIONAL_BIOMES } from '../world/foundational.js';
import { MILESTONES, progressSummary, currentPhase } from '../world/progress.js';

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
    this.show('viewing');
    this.show('controls-hint');
    document.getElementById('loader')?.setAttribute('hidden', '');
    this.renderStats(world);
    this.renderSparkline(world);
    this.renderProgress();
    this.renderAtlas(world.atlas);
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

    // The VIEWING indicator names the deepest place you've descended to.
    const deepest = crumbs[crumbs.length - 1];
    const name = document.getElementById('viewing-name');
    if (name) name.textContent = deepest && crumbs.length > 1 ? deepest.label : 'the cosmos';
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
    ).join('') +
      `<li id="stat-explorers-row"><span class="sl">HERE NOW</span>` +
      `<span class="sv accent" id="stat-explorers">1</span></li>`;
  }

  /** Live count of explorers currently in the cosmos (including you). */
  setPresence(total: number): void {
    const el = document.getElementById('stat-explorers');
    if (el) el.textContent = fmt(Math.max(1, total));
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

  private renderProgress(): void {
    const el = document.getElementById('build-status');
    if (!el) return;
    const { done, total, pct } = progressSummary();
    const phase = currentPhase();
    const phases = [1, 2, 3, 4];
    const bars = phases.map((p) => {
      const ms = MILESTONES.filter((m) => m.phase === p);
      const d  = ms.filter((m) => m.state === 'done').length;
      const pa = ms.filter((m) => m.state === 'partial').length;
      const pp = Math.round((d + pa * 0.5) / ms.length * 100);
      const cls = p < phase ? 'phase-done' : p === phase ? 'phase-active' : 'phase-future';
      const fill = Math.round(pp / 100 * 8);
      const bar = '█'.repeat(fill) + '░'.repeat(8 - fill);
      return `<div class="phase-row ${cls}"><span class="pl">P${p}</span><span class="pb">${bar}</span><span class="pp">${pp}%</span></div>`;
    }).join('');
    el.innerHTML = `
      <div class="bs-head">
        <span class="mono-label">BUILD STATUS</span>
        <span class="mono-label bs-pct">${pct}%</span>
      </div>
      ${bars}
      <div class="bs-count">${done}/${total} milestones · phase ${phase}</div>`;
  }

  private renderAtlas(atlas: AtlasEntry[]): void {
    const el = document.getElementById('atlas-log');
    if (!el || !atlas.length) return;
    el.removeAttribute('hidden');
    const recent = [...atlas].reverse().slice(0, 3);
    el.innerHTML = `<div class="atlas-head"><span class="mono-label">ATLAS LOG</span></div>` +
      recent.map((e) =>
        `<div class="atlas-entry"><span class="ae-day">D${e.day}</span><span class="ae-text">${e.text}</span></div>`,
      ).join('');
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
