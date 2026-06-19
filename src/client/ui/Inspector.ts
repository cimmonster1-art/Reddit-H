import type { SelectionStore } from '../scene/interaction/SelectionStore.js';
import type { SelectionPayload } from '../scene/raycastable.js';
import type { Organ, CommentNode, ReplyBranch } from '../../shared/types.js';
import type { FoundationalBiome } from '../world/foundational.js';
import { VITAL_LABEL } from '../../shared/vocab.js';

// Flat, cold readout for the current selection — no card, no glass. Writes a
// mono kicker, a title, an inline stat row and one text action into the
// hairline-topped #inspector strip from index.html. Parent context (the thread
// a comment lives in, the comment a reply answers) is pushed in by the
// controller so the strip can show where you are in the descent.
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
    const root = document.getElementById('inspector');
    if (!root) return;
    if (!p || p.kind === 'planet') { root.setAttribute('hidden', ''); return; }
    root.removeAttribute('hidden');
    if (p.kind === 'biome') this.renderBiome(p, p.data as FoundationalBiome);
    else if (p.kind === 'thread') this.renderThread(p, p.data as Organ);
    else if (p.kind === 'comment') this.renderComment(p, p.data as CommentNode);
    else if (p.kind === 'reply') this.renderReply(p.data as ReplyBranch);
  }

  private renderBiome(p: SelectionPayload, b: FoundationalBiome): void {
    this.set('insp-kicker', `GALAXY · ${b.archetype.toUpperCase()}`);
    this.set('insp-title', p.label);
    this.set('insp-blurb', b.blurb);
    this.stats([['weight', pct(b.weight)], ['hue', `${Math.round(b.hue)}°`]]);
    this.dive('Dive in ↓');
  }

  private renderThread(p: SelectionPayload, o: Organ): void {
    this.set('insp-kicker', `STAR · ${VITAL_LABEL[o.state].toUpperCase()}`);
    this.set('insp-title', o.title);
    this.set('insp-blurb', '');
    this.stats([
      ['lift', String(o.lift)], ['nerves', String(o.nerves)],
      ['oxygen', pct(o.oxygen)], ['spores', String(o.spores)],
    ]);
    void p;
    this.dive('Descend to comments ↓');
  }

  private renderComment(p: SelectionPayload, c: CommentNode): void {
    this.set('insp-kicker', `COMMENT · u/${c.author}`);
    this.set('insp-title', c.excerpt);
    this.set('insp-blurb', this.thread ? `in ${this.thread}` : '');
    this.stats([
      ['fuel', String(c.score)], ['replies', String(c.replyCount)], ['age', age(c.ageHours)],
    ]);
    void p;
    if (c.replyCount > 0) this.dive('Trace replies ↓');
    else this.hideAction();
  }

  private renderReply(r: ReplyBranch): void {
    this.set('insp-kicker', `REPLY · u/${r.author}`);
    this.set('insp-title', r.excerpt);
    this.set('insp-blurb', this.comment ? `to “${truncate(this.comment)}”` : '');
    this.stats([['fuel', String(r.score)], ['age', age(r.ageHours)]]);
    this.hideAction();
  }

  private stats(rows: [string, string][]): void {
    const el = document.getElementById('insp-stats');
    if (el) el.innerHTML = rows
      .map(([l, v]) => `<span class="stat"><b>${v}</b><i>${l}</i></span>`)
      .join('');
  }

  /** The shared action becomes a dive button toward the current selection. */
  private dive(label: string): void {
    const el = document.getElementById('insp-action');
    if (!el) return;
    el.textContent = label;
    el.removeAttribute('hidden');
    el.onclick = () => {
      const sel = this.store.selected.get();
      if (sel) this.onEnter(sel);
    };
  }

  private hideAction(): void {
    const el = document.getElementById('insp-action');
    if (!el) return;
    el.onclick = null;
    el.setAttribute('hidden', '');
  }

  private set(id: string, text: string): void {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
}

const pct = (n: number) => `${Math.round(n * 100)}%`;
const truncate = (s: string) => (s.length > 48 ? `${s.slice(0, 47)}…` : s);

function age(hours: number): string {
  if (hours < 1) return '<1h';
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}
