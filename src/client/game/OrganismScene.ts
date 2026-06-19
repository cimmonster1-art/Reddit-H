import Phaser from 'phaser';
import type { Organ, WorldState } from '../../shared/types.js';
import { COLOR, VITAL_COLOR, hsl } from './palette.js';

export type ZoomLevel = 'world' | 'region' | 'organ' | 'signal';

/**
 * The hero object: a subreddit rendered as one living organism floating in the
 * void. Organs (posts) grow on a disc, veins (comment threads) branch between
 * them, oxygen (views) drifts as pale mist, lift (upvotes) rises as orange
 * current, and storms (controversy) flash red. Everything is derived from the
 * server-authored WorldState — the scene never invents structure.
 */
export class OrganismScene extends Phaser.Scene {
  private world!: WorldState;
  private onSelect!: (organ: Organ) => void;

  private cx = 0;
  private cy = 0;
  private radius = 0;
  private zoom: ZoomLevel = 'world';

  private core!: Phaser.GameObjects.Arc;
  private coreGlow!: Phaser.GameObjects.Arc;
  private veins!: Phaser.GameObjects.Graphics;
  private biomeGfx!: Phaser.GameObjects.Graphics;
  private organNodes: { organ: Organ; node: Phaser.GameObjects.Container; baseR: number }[] = [];
  private oxygenEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private liftEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private t = 0;

  constructor() {
    super('organism');
  }

  init(data: { world: WorldState; onSelect: (o: Organ) => void }): void {
    this.world = data.world;
    this.onSelect = data.onSelect;
  }

  preload(): void {
    // Generate soft particle + star textures procedurally so we ship no binary assets.
    this.makeSoftDot('soft', 64, 0xffffff);
    this.makeSoftDot('softSmall', 24, 0xffffff);
  }

  create(): void {
    this.computeLayout();

    this.drawBackdrop();
    this.biomeGfx = this.add.graphics();
    this.veins = this.add.graphics();

    this.coreGlow = this.add
      .circle(this.cx, this.cy, this.radius * 0.42, COLOR.nerve, 0.12)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.core = this.add.circle(this.cx, this.cy, this.radius * 0.3, COLOR.crust, 0.85);
    this.core.setStrokeStyle(2, COLOR.nerve, 0.5);

    this.drawBiomes();
    this.drawOrgans();
    this.drawVeins();
    this.spawnOxygen();
    this.spawnLift();

    this.scale.on('resize', this.handleResize, this);
    this.input.on('pointerdown', () => {}); // ensures input system is warm on mobile
  }

  // ---- layout ----

  private computeLayout(): void {
    const { width, height } = this.scale.gameSize;
    this.cx = width / 2;
    this.cy = height / 2;
    this.radius = Math.min(width, height) * 0.42;
  }

  /** Project an organ's (u,v) onto the disc. v=latitude -> ring radius, u -> angle. */
  private project(o: Organ): { x: number; y: number } {
    const ang = o.u * Math.PI * 2;
    const ring = 0.42 + o.v * 0.55; // keep clear of the very center
    return {
      x: this.cx + Math.cos(ang) * this.radius * ring,
      y: this.cy + Math.sin(ang) * this.radius * ring * 0.82, // slight vertical squash => "in orbit"
    };
  }

  // ---- backdrop ----

  private drawBackdrop(): void {
    const { width, height } = this.scale.gameSize;
    const g = this.add.graphics();
    g.fillGradientStyle(COLOR.void1, COLOR.void1, COLOR.void0, COLOR.void0, 1);
    g.fillRect(0, 0, width, height);

    // drifting starfield
    const stars = this.add.particles(0, 0, 'softSmall', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      quantity: 1,
      frequency: 140,
      lifespan: 9000,
      alpha: { start: 0, end: 0.5, ease: 'Sine.easeInOut' },
      scale: { min: 0.04, max: 0.16 },
      tint: [COLOR.oxygen, 0xffffff, COLOR.nerve],
      speedY: { min: -4, max: 4 },
      blendMode: 'ADD',
    });
    stars.setDepth(-10);
  }

  // ---- biomes (flair regions) ----

  private drawBiomes(): void {
    this.biomeGfx.clear();
    let start = -Math.PI / 2;
    const total = this.world.biomes.reduce((s, b) => s + Math.max(0.04, b.weight), 0) || 1;
    for (const b of this.world.biomes) {
      const sweep = (Math.max(0.04, b.weight) / total) * Math.PI * 2;
      const color = hsl(b.hue);
      // faint biome arc just inside the orbit ring
      this.biomeGfx.lineStyle(this.zoom === 'region' ? 10 : 6, color, this.zoom === 'region' ? 0.5 : 0.28);
      this.biomeGfx.beginPath();
      this.biomeGfx.arc(this.cx, this.cy, this.radius * 1.02, start, start + sweep);
      this.biomeGfx.strokePath();
      start += sweep;
    }
    // outer orbit ring
    this.biomeGfx.lineStyle(1, COLOR.nerve, 0.2);
    this.biomeGfx.strokeCircle(this.cx, this.cy, this.radius * 1.08);
  }

  // ---- organs (posts) ----

  private drawOrgans(): void {
    for (const entry of this.organNodes) entry.node.destroy();
    this.organNodes = [];

    const maxLift = Math.max(1, ...this.world.organs.map((o) => o.lift));

    for (const organ of this.world.organs) {
      const { x, y } = this.project(organ);
      const baseR = 5 + (organ.lift / maxLift) * 16 + organ.oxygen * 4;
      const color = VITAL_COLOR[organ.state];

      const container = this.add.container(x, y);

      // oxygen halo (views) — pale, atmospheric, scales with oxygen
      const halo = this.add
        .circle(0, 0, baseR + 10 + organ.oxygen * 22, COLOR.oxygen, 0.05 + organ.oxygen * 0.12)
        .setBlendMode(Phaser.BlendModes.ADD);

      // electric blood glow (lift)
      const glow = this.add
        .circle(0, 0, baseR + 5, color, 0.22)
        .setBlendMode(Phaser.BlendModes.ADD);

      const body = this.add.circle(0, 0, baseR, color, 0.92);
      body.setStrokeStyle(1.5, 0xffffff, 0.35);

      container.add([halo, glow, body]);
      container.setData('halo', halo);
      container.setData('glow', glow);
      container.setData('body', body);
      container.setSize(baseR * 2 + 16, baseR * 2 + 16);
      container.setInteractive(
        new Phaser.Geom.Circle(0, 0, baseR + 8),
        Phaser.Geom.Circle.Contains
      );
      container.on('pointerover', () => this.input.setDefaultCursor('pointer'));
      container.on('pointerout', () => this.input.setDefaultCursor('default'));
      container.on('pointerdown', () => {
        this.pingOrgan(container, color);
        this.onSelect(organ);
      });

      // storm flash for inflamed organs
      if (organ.inflammation > 0.35) {
        const storm = this.add
          .circle(0, 0, baseR + 16, COLOR.storm, 0.18)
          .setBlendMode(Phaser.BlendModes.ADD);
        container.addAt(storm, 0);
        this.tweens.add({
          targets: storm,
          alpha: { from: 0.04, to: 0.3 },
          scale: { from: 0.9, to: 1.2 },
          duration: 380 + Math.random() * 240,
          yoyo: true,
          repeat: -1,
        });
      }

      // gentle idle breathing per organ
      this.tweens.add({
        targets: body,
        scale: { from: 0.94, to: 1.06 },
        duration: 1800 + Math.random() * 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.organNodes.push({ organ, node: container, baseR });
    }
  }

  private pingOrgan(c: Phaser.GameObjects.Container, color: number): void {
    const ring = this.add
      .circle(c.x, c.y, 6, color, 0.6)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: ring,
      radius: 60,
      alpha: 0,
      duration: 480,
      onComplete: () => ring.destroy(),
    });
  }

  // ---- veins (comment threads / nervous system) ----

  private drawVeins(): void {
    this.veins.clear();
    const nodes = this.organNodes;
    // connect each organ to its 1–2 nearest neighbours -> a branching nerve web.
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      const ap = { x: a.node.x, y: a.node.y };
      const neighbours = nodes
        .filter((_, j) => j !== i)
        .map((b) => ({ b, d: dist(ap, { x: b.node.x, y: b.node.y }) }))
        .sort((m, n) => m.d - n.d)
        .slice(0, a.organ.nerves > 12 ? 2 : 1);
      for (const { b } of neighbours) {
        const alpha = Math.min(0.34, 0.08 + a.organ.nerves / 200);
        this.veins.lineStyle(1, COLOR.nerve, alpha);
        // slight curve toward the core for an organic look
        const mx = (ap.x + b.node.x) / 2 + (this.cx - (ap.x + b.node.x) / 2) * 0.18;
        const my = (ap.y + b.node.y) / 2 + (this.cy - (ap.y + b.node.y) / 2) * 0.18;
        this.veins.beginPath();
        this.veins.moveTo(ap.x, ap.y);
        this.veins.lineTo(mx, my);
        this.veins.lineTo(b.node.x, b.node.y);
        this.veins.strokePath();
      }
    }
  }

  // ---- oxygen (views) ----

  private spawnOxygen(): void {
    const { width, height } = this.scale.gameSize;
    this.oxygenEmitter = this.add.particles(0, 0, 'soft', {
      x: { min: 0, max: width },
      y: height + 20,
      lifespan: 7000,
      quantity: 1,
      frequency: Math.max(60, 400 - this.world.metabolism.oxygen / 50),
      alpha: { start: 0.16, end: 0 },
      scale: { min: 0.3, max: 0.9 },
      tint: COLOR.oxygen,
      speedY: { min: -22, max: -8 },
      speedX: { min: -8, max: 8 },
      blendMode: 'ADD',
    });
    this.oxygenEmitter.setDepth(-5);
  }

  // ---- lift (upvotes) ----

  private spawnLift(): void {
    // orange electricity rising from the brightest (sun) organs
    const suns = this.world.organs.filter((o) => o.state === 'sun-organ' || o.lift > 60);
    if (suns.length === 0) return;
    this.liftEmitter = this.add.particles(0, 0, 'softSmall', {
      lifespan: 1400,
      quantity: 1,
      frequency: 90,
      alpha: { start: 0.8, end: 0 },
      scale: { min: 0.1, max: 0.4 },
      tint: COLOR.lift,
      speedY: { min: -60, max: -110 },
      speedX: { min: -12, max: 12 },
      blendMode: 'ADD',
      emitting: true,
    });
    this.liftEmitter.setDepth(2);
    // move the emitter between sun organs over time
    let idx = 0;
    this.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => {
        const o = suns[idx % suns.length];
        const p = this.project(o);
        this.liftEmitter?.setPosition(p.x, p.y);
        idx++;
      },
    });
  }

  // ---- loop ----

  override update(_time: number, delta: number): void {
    this.t += delta / 1000;
    const pulse = this.world.weather.pulse;
    const s = 1 + Math.sin(this.t * (0.8 + pulse)) * 0.05 * (0.6 + pulse);
    this.core.setScale(s);
    this.coreGlow.setScale(s * (1.05 + Math.sin(this.t * 0.6) * 0.05));
    this.coreGlow.setAlpha(0.1 + Math.abs(Math.sin(this.t * 0.7)) * 0.12);
  }

  // ---- external controls ----

  setZoom(z: ZoomLevel): void {
    this.zoom = z;
    this.drawBiomes();
    // signal mode brightens currents; organ mode enlarges nodes a touch
    const organScale = z === 'organ' ? 1.25 : 1;
    for (const e of this.organNodes) {
      this.tweens.add({ targets: e.node, scale: organScale, duration: 250, ease: 'Sine.easeInOut' });
    }
    if (this.liftEmitter) this.liftEmitter.frequency = z === 'signal' ? 40 : 90;
    if (this.oxygenEmitter) {
      const halos = this.organNodes.map((n) => n.node.getData('halo') as Phaser.GameObjects.Arc);
      for (const h of halos) this.tweens.add({ targets: h, alpha: z === 'signal' ? 0.22 : 0.1, duration: 250 });
    }
  }

  /** Swap in a new world (after a vote/action) without rebuilding the scene. */
  applyWorld(world: WorldState): void {
    this.world = world;
    this.drawBiomes();
    this.drawOrgans();
    this.drawVeins();
  }

  private handleResize(): void {
    this.computeLayout();
    this.core.setPosition(this.cx, this.cy);
    this.coreGlow.setPosition(this.cx, this.cy);
    this.drawBiomes();
    this.drawOrgans();
    this.drawVeins();
  }

  // ---- texture gen ----

  private makeSoftDot(key: string, size: number, color: number): void {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const r = size / 2;
    for (let i = r; i > 0; i--) {
      const a = Math.pow(i / r, 2);
      g.fillStyle(color, (1 - a) * 0.9);
      g.fillCircle(r, r, i);
    }
    g.generateTexture(key, size, size);
    g.destroy();
  }
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
