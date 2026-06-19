import type { SelectionStore } from '../scene/interaction/SelectionStore.js';
import type { SelectionPayload } from '../scene/raycastable.js';
import type { Organ } from '../../shared/types.js';
import type { FoundationalBiome } from '../world/foundational.js';
import { VITAL_LABEL } from '../../shared/vocab.js';

// Flat, cold readout for the current selection — no card, no glass. Writes a
// mono kicker, a title, an inline stat row and one text action into the
// hairline-topped #inspector strip from index.html.
export class Inspector {
  constructor(
    private store: SelectionStore,
    private onEnter: (payload: SelectionPayload) => void,
  ) {
    this.store.selected.subscribe((p) => this.render(p));
  }

  private render(p: SelectionPayload | null): void {
    const root = document.getElementById('inspector');
    if (!root) return;
    if (!p || p.kind === 'planet') { root.setAttribute('hidden', ''); return; }
    root.removeAttribute('hidden');
    if (p.kind === 'biome') this.renderBiome(p, p.data as FoundationalBiome);
    else if (p.kind === 'thread') this.renderThread(p.data as Organ);
  }

  private renderBiome(p: SelectionPayload, b: FoundationalBiome): void {
    this.set('insp-kicker', `GALAXY · ${b.archetype.toUpperCase()}`);
    this.set('insp-title', p.label);
    this.set('insp-blurb', b.blurb);
    this.stats([['weight', pct(b.weight)], ['hue', `${Math.round(b.hue)}°`]]);
    this.action('Dive in ↓', () => {
      const sel = this.store.selected.get();
      if (sel) this.onEnter(sel);
    });
  }

  private renderThread(o: Organ): void {
    this.set('insp-kicker', `STAR · ${VITAL_LABEL[o.state].toUpperCase()}`);
    this.set('insp-title', o.title);
    this.set('insp-blurb', '');
    this.stats([
      ['lift', String(o.lift)], ['nerves', String(o.nerves)],
      ['oxygen', pct(o.oxygen)], ['spores', String(o.spores)],
    ]);
    this.action('Open thread ↗', () => window.open(o.permalink, '_blank', 'noopener'));
  }

  private stats(rows: [string, string][]): void {
    const el = document.getElementById('insp-stats');
    if (el) el.innerHTML = rows
      .map(([l, v]) => `<span class="stat"><b>${v}</b><i>${l}</i></span>`)
      .join('');
  }

  private action(label: string, fn: () => void): void {
    const el = document.getElementById('insp-action');
    if (!el) return;
    el.textContent = label;
    el.onclick = fn;
  }

  private set(id: string, text: string): void {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
}

const pct = (n: number) => `${Math.round(n * 100)}%`;
