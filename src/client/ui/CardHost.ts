import type { SelectionStore } from '../scene/interaction/SelectionStore.js';
import type { SelectionPayload } from '../scene/raycastable.js';
import type { Organ } from '../../shared/types.js';
import type { FoundationalBiome } from '../world/foundational.js';
import { VITAL_LABEL, VITAL_BLURB } from '../../shared/vocab.js';

// Renders the contextual card for the current selection into the glass DOM from
// index.html. Dumb by design: it reads a payload and writes text. Each card
// type fully owns its action element (the shared #detail-link).
export class CardHost {
  constructor(
    private store: SelectionStore,
    private onEnter: (payload: SelectionPayload) => void,
  ) {
    this.store.selected.subscribe((p) => this.render(p));
    document.querySelector('[data-close="detail-card"]')?.addEventListener('click', () => {
      this.store.selected.set(null);
    });
  }

  private render(p: SelectionPayload | null): void {
    const card = document.getElementById('detail-card');
    if (!card) return;
    if (!p || p.kind === 'planet') { card.setAttribute('hidden', ''); return; }
    card.removeAttribute('hidden');
    if (p.kind === 'biome') this.renderBiome(p, p.data as FoundationalBiome);
    else if (p.kind === 'thread') this.renderThread(p, p.data as Organ);
  }

  private renderBiome(p: SelectionPayload, b: FoundationalBiome): void {
    this.set('detail-title', p.label);
    this.set('detail-state', b.archetype.toUpperCase());
    this.set('detail-blurb', b.blurb);
    this.vitals([['weight', pct(b.weight)], ['hue', `${Math.round(b.hue)}°`]]);
    this.asDiveButton('Dive into biome ↓');
  }

  private renderThread(p: SelectionPayload, o: Organ): void {
    this.set('detail-title', o.title);
    this.set('detail-state', VITAL_LABEL[o.state]);
    this.set('detail-blurb', VITAL_BLURB[o.state]);
    this.vitals([
      ['lift', String(o.lift)], ['nerves', String(o.nerves)],
      ['oxygen', pct(o.oxygen)], ['spores', String(o.spores)],
    ]);
    this.asExternalLink(o.permalink);
    void p;
  }

  /** Turn the shared link element into an in-world dive button. */
  private asDiveButton(text: string): void {
    const link = this.link();
    if (!link) return;
    link.textContent = text;
    link.removeAttribute('href');
    link.removeAttribute('hidden');
    link.onclick = (e) => {
      e.preventDefault();
      const sel = this.store.selected.get();
      if (sel) this.onEnter(sel);
    };
  }

  /** Turn the shared link element into an external permalink anchor. */
  private asExternalLink(href: string): void {
    const link = this.link();
    if (!link) return;
    link.textContent = 'Enter thread ↗';
    link.href = href;
    link.onclick = null;
    link.removeAttribute('hidden');
  }

  private link(): HTMLAnchorElement | null {
    return document.getElementById('detail-link') as HTMLAnchorElement | null;
  }

  private vitals(rows: [string, string][]): void {
    const el = document.getElementById('detail-vitals');
    if (el) el.innerHTML = rows
      .map(([l, v]) => `<div class="vital"><span class="v">${v}</span><span class="l">${l}</span></div>`)
      .join('');
  }

  private set(id: string, text: string): void {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
}

const pct = (n: number) => `${Math.round(n * 100)}%`;
