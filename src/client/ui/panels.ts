// Wires the glass DOM overlays to the API and the Phaser scene. Keeps all
// imperative DOM poking in one place so the scene stays purely visual.

import type {
  InitResponse,
  Organ,
  WorldState,
  DailyAction,
  GrowthChoice,
} from '../../shared/types.js';
import {
  ACTION_LABEL,
  VITAL_BLURB,
  VITAL_LABEL,
} from '../../shared/vocab.js';
import { api } from '../api.js';
import type { OrganismScene, ZoomLevel } from '../game/OrganismScene.js';

const ACTION_ICON: Record<DailyAction, string> = {
  explore: '◎',
  nurture: '❀',
  stabilize: '⊘',
  seed: '✦',
  name: '✎',
};

export class UIController {
  private world: WorldState;
  private me: InitResponse['me'];

  constructor(private scene: OrganismScene, init: InitResponse) {
    this.world = init.world;
    this.me = init.me;
  }

  mount(): void {
    document.getElementById('loader')!.hidden = true;
    for (const id of ['topbar', 'digest-toggle', 'ritual', 'actions', 'zoombar']) {
      document.getElementById(id)!.hidden = false;
    }

    this.renderMetabolism();
    this.renderDigest();
    this.renderRitual();
    this.renderActions();
    this.wireZoom();
    this.wireCloseButtons();

    // open the digest once on load — the daily payoff is the first thing you see
    this.openCard('digest-card');
  }

  // The scene calls this when an organ is tapped.
  onOrganSelect = (o: Organ): void => this.openDetail(o);

  private renderMetabolism(): void {
    const m = this.world.metabolism;
    document.getElementById('metabolism')!.innerHTML =
      `<span class="m-ox">oxygen <b>${fmt(m.oxygen)}</b></span>` +
      `<span class="m-li">lift <b>${fmt(m.bloodflow)}</b></span>` +
      `<span class="m-ne">nerves <b>${fmt(m.nerves)}</b></span>`;
  }

  private renderDigest(): void {
    document.getElementById('digest-title')!.textContent = `Day ${this.world.day} · Today’s Bloom`;
    const ul = document.getElementById('digest-lines')!;
    ul.innerHTML = '';
    for (const line of this.world.digest) {
      const li = document.createElement('li');
      li.textContent = line;
      ul.appendChild(li);
    }
    document.getElementById('digest-toggle')!.onclick = () => this.toggleCard('digest-card');
  }

  private renderActions(): void {
    const nav = document.getElementById('actions')!;
    nav.innerHTML = '';
    (Object.keys(ACTION_LABEL) as DailyAction[]).forEach((a) => {
      const btn = document.createElement('button');
      btn.className = 'act';
      btn.innerHTML = `<span class="ai">${ACTION_ICON[a]}</span>${ACTION_LABEL[a]}`;
      btn.disabled = this.me.actedToday;
      btn.onclick = () => this.doAction(a);
      nav.appendChild(btn);
    });
    if (this.me.actedToday) this.markActionsDone();
  }

  private async doAction(action: DailyAction): Promise<void> {
    const res = await api.act({ action });
    this.toast(res.message);
    if (res.ok && res.world && res.me) {
      this.world = res.world;
      this.me = res.me;
      this.scene.applyWorld(this.world);
      this.markActionsDone();
      this.celebrateStreak();
    }
  }

  private markActionsDone(): void {
    document.querySelectorAll<HTMLButtonElement>('#actions .act').forEach((b) => (b.disabled = true));
  }

  private renderRitual(): void {
    document.getElementById('ritual-prompt')!.textContent = this.world.growth.prompt || 'Growth Ritual';
    const wrap = document.getElementById('ritual-options')!;
    wrap.innerHTML = '';
    const totalVotes = this.world.growth.options.reduce((s, o) => s + o.votes, 0);
    for (const opt of this.world.growth.options) {
      const el = document.createElement('div');
      el.className = 'ritual-opt';
      const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
      el.innerHTML =
        `<div class="ro-text"><span class="ro-label">${opt.label}</span>` +
        `<span class="ro-blurb">${opt.blurb}</span></div>` +
        `<span class="ro-meter">${this.me.votedToday ? pct + '%' : ''}</span>`;
      if (!this.me.votedToday) el.onclick = () => this.doVote(opt.choice, el);
      wrap.appendChild(el);
    }
    this.renderRitualStatus();
  }

  private renderRitualStatus(): void {
    const s = document.getElementById('ritual-status')!;
    if (this.me.votedToday) {
      s.textContent = 'Your voice is counted. Return tomorrow to see what grew.';
    } else if (this.world.growth.resolvedYesterday) {
      s.textContent = `Yesterday the community chose to ${this.world.growth.resolvedYesterday.label.toLowerCase()}.`;
    } else {
      s.textContent = 'One voice per day. Choose what the organism becomes.';
    }
  }

  private async doVote(choice: GrowthChoice, el: HTMLElement): Promise<void> {
    el.classList.add('chosen');
    const res = await api.vote({ choice });
    this.toast(res.message);
    if (res.ok && res.world && res.me) {
      this.world = res.world;
      this.me = res.me;
      this.renderRitual();
      this.celebrateStreak();
    }
  }

  private wireZoom(): void {
    document.querySelectorAll<HTMLButtonElement>('#zoombar button').forEach((b) => {
      b.onclick = () => {
        document.querySelectorAll('#zoombar button').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        this.scene.setZoom(b.dataset.zoom as ZoomLevel);
      };
    });
  }

  private openDetail(o: Organ): void {
    document.getElementById('detail-title')!.textContent = o.title;
    const chip = document.getElementById('detail-state')!;
    chip.textContent = VITAL_LABEL[o.state];
    document.getElementById('detail-blurb')!.textContent = VITAL_BLURB[o.state];
    document.getElementById('detail-vitals')!.innerHTML =
      vital('lift', o.lift) +
      vital('nerves', o.nerves) +
      vital('oxygen', Math.round(o.oxygen * 100), '%') +
      vital('age', Math.round(o.ageHours) + 'h', '');
    const link = document.getElementById('detail-link') as HTMLAnchorElement;
    link.href = o.permalink.startsWith('http') ? o.permalink : `https://reddit.com${o.permalink}`;
    this.openCard('detail-card');
  }

  // ---- card plumbing ----

  private wireCloseButtons(): void {
    document.querySelectorAll<HTMLButtonElement>('[data-close]').forEach((b) => {
      b.onclick = () => (document.getElementById(b.dataset.close!)!.hidden = true);
    });
  }
  private openCard(id: string): void {
    for (const c of ['digest-card', 'detail-card']) document.getElementById(c)!.hidden = c !== id;
  }
  private toggleCard(id: string): void {
    const el = document.getElementById(id)!;
    if (el.hidden) this.openCard(id);
    else el.hidden = true;
  }

  private celebrateStreak(): void {
    if (this.me.streak > 1) this.toast(`🔥 ${this.me.streak}-day streak`);
  }

  private toast(msg: string): void {
    const t = document.getElementById('toast')!;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout((t as unknown as { _h?: number })._h);
    (t as unknown as { _h?: number })._h = window.setTimeout(() => (t.hidden = true), 2600);
  }
}

function vital(label: string, value: number | string, suffix = ''): string {
  return `<div class="vital"><span class="v">${value}${suffix}</span><span class="l">${label}</span></div>`;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${Math.round(n)}`;
}
