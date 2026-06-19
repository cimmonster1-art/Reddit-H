import type { SelectionStore } from '../scene/interaction/SelectionStore.js';
import type { SelectionPayload } from '../scene/raycastable.js';
import type { Organ, CommentNode, ReplyBranch } from '../../shared/types.js';
import type { FoundationalBiome } from '../world/foundational.js';
import { VITAL_LABEL } from '../../shared/vocab.js';

// Drives the right detail panel — four possible section cards: galaxy, star
// (post), comment orbit, reply moon. Cold instrument layout; no glass, no blur.
// All sections individually shown/hidden so they stack at the current zoom depth.
export class Inspector {
  private thread: string | null = null;
  private comment: string | null = null;

  constructor(
    private store: SelectionStore,
    private onEnter: (payload: SelectionPayload) => void,
  ) {
    this.store.selected.subscribe((p) => this.render(p));
  }

  setContext(thread: string | null, comment: string | null): void {
    this.thread = thread;
    this.comment = comment;
  }

  private render(p: SelectionPayload | null): void {
    const panel = document.getElementById('panel-right');
    if (!panel) return;
    this.hideAll();
    if (!p || p.kind === 'planet') { panel.setAttribute('hidden', ''); return; }
    panel.removeAttribute('hidden');
    if      (p.kind === 'biome')   this.renderBiome(p, p.data as FoundationalBiome);
    else if (p.kind === 'thread')  this.renderThread(p, p.data as Organ);
    else if (p.kind === 'comment') this.renderComment(p, p.data as CommentNode);
    else if (p.kind === 'reply')   this.renderReply(p.data as ReplyBranch);
  }

  private renderBiome(p: SelectionPayload, b: FoundationalBiome): void {
    this.show('sel-galaxy');
    this.set('sel-gal-name',  `r/${b.sub}`);
    this.set('sel-gal-sub',   `${b.archetype.toUpperCase()} · hue ${Math.round(b.hue)}°`);
    this.set('sel-gal-blurb', b.blurb);
    this.renderGalaxyThumb(b);
    this.detailStats('sel-gal-stats', [
      ['weight', pct(b.weight)], ['hue', `${Math.round(b.hue)}°`],
    ]);
    this.wire('sel-gal-dive', 'Dive in ↓', p);
  }

  private renderThread(p: SelectionPayload, o: Organ): void {
    this.show('sel-star');
    this.set('sel-star-title', o.title);
    this.set('sel-star-meta',  `${VITAL_LABEL[o.state].toUpperCase()} · ${age(o.ageHours)} ago`);
    this.detailStats('sel-star-stats', [
      ['lift', fmt(o.lift)], ['comments', fmt(o.nerves)],
      ['oxygen', pct(o.oxygen)], ['spores', fmt(o.spores)],
    ]);
    void p;
    this.wire('sel-star-dive', 'Descend to comments ↓', p);
  }

  private renderComment(p: SelectionPayload, c: CommentNode): void {
    this.show('sel-comment');
    this.set('sel-cmt-text', c.excerpt);
    this.set('sel-cmt-meta', `u/${c.author}${this.thread ? ` · in ${truncate(this.thread)}` : ''}`);
    this.detailStats('sel-cmt-stats', [
      ['fuel', fmt(c.score)], ['replies', String(c.replyCount)], ['age', age(c.ageHours)],
    ]);
    void p;
    if (c.replyCount > 0) this.wire('sel-cmt-dive', 'Trace replies ↓', p);
    else document.getElementById('sel-cmt-dive')?.setAttribute('hidden', '');
  }

  private renderReply(r: ReplyBranch): void {
    this.show('sel-reply');
    this.set('sel-rpl-text', r.excerpt);
    this.set('sel-rpl-meta', `u/${r.author}${this.comment ? ` · to "${truncate(this.comment)}"` : ''}`);
    this.detailStats('sel-rpl-stats', [['fuel', fmt(r.score)], ['age', age(r.ageHours)]]);
  }

  private renderGalaxyThumb(b: FoundationalBiome): void {
    const canvas = document.getElementById('galaxy-thumb') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2;
    ctx.clearRect(0, 0, W, H);
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
    core.addColorStop(0,   `hsla(${b.hue},70%,88%,1)`);
    core.addColorStop(0.4, `hsla(${b.hue},60%,55%,0.55)`);
    core.addColorStop(1,   `hsla(${b.hue},50%,30%,0)`);
    ctx.fillStyle = core; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 130; i++) {
      const t = (i / 130) ** 0.55;
      const r = t * 26;
      const theta = i * 2.39996 + r * 0.45;
      const x = cx + Math.cos(theta) * r;
      const y = cy + Math.sin(theta) * r * 0.44;
      const a = (1 - t) * 0.72;
      ctx.fillStyle = `hsla(${b.hue},70%,78%,${a})`;
      ctx.beginPath(); ctx.arc(x, y, 1.1, 0, Math.PI * 2); ctx.fill();
    }
  }

  private detailStats(id: string, rows: [string, string][]): void {
    const el = document.getElementById(id);
    if (el) el.innerHTML = rows
      .map(([l, v]) => `<span class="ds"><b>${v}</b><i>${l}</i></span>`)
      .join('');
  }

  private wire(id: string, label: string, p: SelectionPayload): void {
    const el = document.getElementById(id) as HTMLButtonElement | null;
    if (!el) return;
    el.textContent = label;
    el.removeAttribute('hidden');
    el.onclick = () => {
      const sel = this.store.selected.get();
      if (sel) this.onEnter(sel);
      void p;
    };
  }

  private hideAll(): void {
    ['sel-galaxy','sel-star','sel-comment','sel-reply'].forEach((id) =>
      document.getElementById(id)?.setAttribute('hidden', ''));
    ['sel-gal-dive','sel-star-dive','sel-cmt-dive'].forEach((id) =>
      document.getElementById(id)?.setAttribute('hidden', ''));
  }

  private show(id: string): void { document.getElementById(id)?.removeAttribute('hidden'); }

  private set(id: string, text: string): void {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
}

const pct = (n: number) => `${Math.round(n * 100)}%`;
const truncate = (s: string) => s.length > 40 ? `${s.slice(0, 39)}…` : s;

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return String(Math.round(n));
}

function age(hours: number): string {
  if (hours < 1)  return '<1h';
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}
