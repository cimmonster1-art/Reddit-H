import * as THREE from 'three';
import { SceneRoot } from './core/SceneRoot.js';
import { CameraController } from './camera/CameraController.js';
import { ZoomController } from './camera/ZoomController.js';
import { RaycastManager } from './interaction/RaycastManager.js';
import { PointerInput } from './interaction/PointerInput.js';
import { SelectionStore } from './interaction/SelectionStore.js';
import { Atmosphere } from './world/Atmosphere.js';
import { PlanetShell } from './world/PlanetShell.js';
import { BiomeField } from './world/BiomeField.js';
import { ThreadField } from './world/ThreadField.js';
import { UpvoteCurrent } from './effects/UpvoteCurrent.js';
import { FOUNDATIONAL_BIOMES } from '../world/foundational.js';
import type { SelectionPayload } from './raycastable.js';
import type { WorldState } from '../../shared/types.js';

// Orchestrates the whole substrate: builds subsystems, maps a WorldState into
// scene content, and wires pointer -> raycast -> selection -> zoom/card. This is
// the only file that knows about every layer; each layer stays ignorant of the
// others.
export class SubstrateController {
  private root: SceneRoot;
  private camera: CameraController;
  private zoom: ZoomController;
  private raycast: RaycastManager;
  private pointer: PointerInput;
  readonly selection = new SelectionStore();

  private atmosphere = new Atmosphere();
  private planet = new PlanetShell();
  private biomes: BiomeField;
  private threads: ThreadField | null = null;
  private current: UpvoteCurrent;

  constructor(private parent: HTMLElement, private world: WorldState) {
    this.root = new SceneRoot(parent);
    this.camera = new CameraController(this.root.camera, this.root.renderer.domElement);
    this.zoom = new ZoomController(this.camera, this.planet.focus());
    this.raycast = new RaycastManager(this.root.camera);
    this.current = new UpvoteCurrent();

    const homeId = this.injectHomeBiome();
    this.biomes = new BiomeField(this.biomeList(), homeId);

    this.root.scene.add(
      this.atmosphere.group, this.planet.object, this.biomes.group, this.current.points,
    );
    this.current.setIntensity(world.metabolism.bloodflow);

    this.registerPickables();
    this.pointer = new PointerInput(this.root.renderer.domElement, {
      onHover: (ndc) => this.selection.hovered.set(this.raycast.pick(ndc)?.payload ?? null),
      onClick: (ndc) => this.onClick(ndc),
    });

    this.bindLoop();
    this.bindHover();
  }

  mount(): void {
    this.camera.attach();
    this.pointer.attach();
    this.camera.frameOn(new THREE.Vector3(), this.planet.focus().radius);
    this.root.loop.start();
  }

  onZoomChange = this.zoom.onChange.bind(this.zoom);

  surfaceTo(index: number): void { this.zoom.surfaceTo(index); }

  /** Dive toward a selection (called by the card 'enter' button). */
  dive(payload: SelectionPayload): void {
    const node = this.find(payload);
    if (!node) return;
    this.zoom.dive(payload, node.focus());
    if (payload.kind === 'biome') this.revealThreads(payload);
  }

  // --- internals -----------------------------------------------------------

  private biomeList() { return FOUNDATIONAL_BIOMES; }

  private injectHomeBiome(): string {
    const sub = this.world.subreddit.toLowerCase();
    const existing = FOUNDATIONAL_BIOMES.find((b) => b.sub.toLowerCase() === sub);
    if (existing) return existing.id;
    const home = {
      id: `b-home-${sub}`, sub: this.world.subreddit, label: this.world.subreddit,
      archetype: 'garden' as const, hue: 188, weight: 0.9, lat: -30, lon: -150,
      blurb: 'Your home biome — the living organism grown from this community.',
    };
    FOUNDATIONAL_BIOMES.unshift(home);
    return home.id;
  }

  private registerPickables(): void {
    this.raycast.register(this.planet);
    for (const n of this.biomes.nodes) this.raycast.register(n);
  }

  private revealThreads(payload: SelectionPayload): void {
    if (this.threads) { this.root.scene.remove(this.threads.group); this.threads = null; }
    const node = this.biomes.byId(payload.id);
    const isHome = payload.id.startsWith('b-home-') ||
      payload.label.toLowerCase() === `r/${this.world.subreddit.toLowerCase()}`;
    if (!node || !isHome) return; // only the home biome has live organ data
    this.threads = new ThreadField(this.world.organs, node.focus().center);
    this.threads.setVisible(true);
    this.root.scene.add(this.threads.group);
    for (const t of this.threads.nodes) this.raycast.register(t);
  }

  private onClick(ndc: THREE.Vector2): void {
    const hit = this.raycast.pick(ndc);
    this.selection.selected.set(hit?.payload ?? null);
    if (hit && hit.payload.kind === 'planet') this.zoom.surfaceTo(0);
  }

  private find(payload: SelectionPayload) {
    if (payload.kind === 'planet') return this.planet;
    if (payload.kind === 'biome') return this.biomes.byId(payload.id) ?? null;
    if (payload.kind === 'thread') return this.threads?.nodes.find((n) => n.payload.id === payload.id) ?? null;
    return null;
  }

  private bindHover(): void {
    this.selection.hovered.subscribe((p) => {
      this.biomes.setHover(p?.kind === 'biome' ? p.id : null);
      this.root.renderer.domElement.style.cursor = p ? 'pointer' : 'default';
    });
  }

  private bindLoop(): void {
    this.root.loop.add((dt, t) => {
      this.camera.update(dt);
      this.atmosphere.update(dt, t);
      this.planet.update(dt, t);
      this.biomes.update(dt, t);
      this.threads?.update(dt, t);
      this.current.update(dt);
    });
  }
}
