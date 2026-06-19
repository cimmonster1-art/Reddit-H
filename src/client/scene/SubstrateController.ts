import * as THREE from 'three';
import { SceneRoot } from './core/SceneRoot.js';
import { CameraController } from './camera/CameraController.js';
import { ZoomController, type ZoomLevel, type Crumb } from './camera/ZoomController.js';
import { RaycastManager } from './interaction/RaycastManager.js';
import { PointerInput } from './interaction/PointerInput.js';
import { SelectionStore } from './interaction/SelectionStore.js';
import { Atmosphere } from './world/Atmosphere.js';
import { PlanetShell } from './world/PlanetShell.js';
import { BiomeField } from './world/BiomeField.js';
import { ThreadField } from './world/ThreadField.js';
import { CommentField } from './world/CommentField.js';
import { ReplyField } from './world/ReplyField.js';
import { UpvoteCurrent } from './effects/UpvoteCurrent.js';
import { FOUNDATIONAL_BIOMES } from '../world/foundational.js';
import { api } from '../api.js';
import type { Raycastable, SelectionPayload } from './raycastable.js';
import type { WorldState, CommentNode } from '../../shared/types.js';

// Orchestrates the whole substrate: builds subsystems, maps a WorldState into
// scene content, and wires pointer -> raycast -> selection -> zoom/card. It also
// owns the lazy thread/comment/reply layer lifecycle: deeper layers are built on
// dive and disposed the moment the camera surfaces above them. This is the only
// file that knows about every layer; each layer stays ignorant of the others.
type ContextFn = (thread: string | null, comment: string | null) => void;

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
  private comments: CommentField | null = null;
  private replies: ReplyField | null = null;
  private current: UpvoteCurrent;

  private ctxThread: string | null = null;
  private contextFn: ContextFn | null = null;

  constructor(parent: HTMLElement, private world: WorldState) {
    this.root = new SceneRoot(parent);
    this.camera = new CameraController(this.root.camera, this.root.renderer.domElement);
    this.zoom = new ZoomController(this.camera, this.planet.focus());
    this.raycast = new RaycastManager(this.root.camera);
    this.current = new UpvoteCurrent();

    const homeId = this.injectHomeBiome();
    this.biomes = new BiomeField(FOUNDATIONAL_BIOMES, homeId);

    this.root.scene.add(
      this.atmosphere.group, this.planet.object, this.biomes.group, this.current.points,
    );
    this.current.setIntensity(world.metabolism.bloodflow);

    this.registerPickables();
    this.pointer = new PointerInput(this.root.renderer.domElement, {
      onHover: (ndc) => this.selection.hovered.set(this.raycast.pick(ndc)?.payload ?? null),
      onClick: (ndc) => this.onClick(ndc),
    });

    this.zoom.onChange((level) => this.syncLayers(level));
    this.bindLoop();
    this.bindHover();
  }

  mount(): void {
    this.camera.attach();
    this.pointer.attach();
    this.camera.frameOn(new THREE.Vector3(), this.planet.focus().radius);
    this.root.loop.start();
  }

  /** Subscribe to zoom-ladder changes (used by the HUD breadcrumb). */
  onZoomChange(fn: (level: ZoomLevel, crumbs: Crumb[]) => void): () => void {
    return this.zoom.onChange(fn);
  }

  /** Subscribe to parent-context changes (thread/comment the inspector shows). */
  onContext(fn: ContextFn): void { this.contextFn = fn; }

  surfaceTo(index: number): void { this.zoom.surfaceTo(index); }

  /** Dive toward a selection (called by the inspector's action). */
  async dive(payload: SelectionPayload): Promise<void> {
    const node = this.find(payload);
    if (!node) return;
    this.zoom.dive(payload, node.focus());
    if (payload.kind === 'biome') this.revealThreads(payload);
    else if (payload.kind === 'thread') await this.revealComments(payload, node.object);
    else if (payload.kind === 'comment') this.revealReplies(payload, node.object);
  }

  // --- internals -----------------------------------------------------------

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
    this.disposeThreads();
    const node = this.biomes.byId(payload.id);
    const isHome = payload.id.startsWith('b-home-') ||
      payload.label.toLowerCase() === `r/${this.world.subreddit.toLowerCase()}`;
    if (!node || !isHome) return; // only the home biome has live organ data
    this.threads = new ThreadField(this.world.organs, node.focus().center);
    this.threads.setVisible(true);
    this.root.scene.add(this.threads.group);
    for (const t of this.threads.nodes) this.raycast.register(t);
  }

  private async revealComments(payload: SelectionPayload, obj: THREE.Object3D): Promise<void> {
    this.disposeComments();
    let data;
    try {
      data = await api.thread(payload.id);
    } catch {
      return;
    }
    const center = obj.getWorldPosition(new THREE.Vector3());
    this.comments = new CommentField(data.comments, center);
    this.root.scene.add(this.comments.group);
    for (const n of this.comments.nodes) this.raycast.register(n);
    this.setContext(payload.label, null);
  }

  private revealReplies(payload: SelectionPayload, obj: THREE.Object3D): void {
    this.disposeReplies();
    const node = payload.data as CommentNode | undefined;
    if (!node || node.replies.length === 0) return;
    const center = obj.getWorldPosition(new THREE.Vector3());
    this.replies = new ReplyField(node.replies, center);
    this.root.scene.add(this.replies.group);
    for (const n of this.replies.nodes) this.raycast.register(n);
    this.setContext(this.ctxThread, payload.label);
  }

  /** Dispose any layers deeper than the current zoom level. */
  private syncLayers(level: ZoomLevel): void {
    if (level === 'planet') this.disposeThreads();
    if (level === 'planet' || level === 'biome') this.disposeComments();
    if (level === 'planet' || level === 'biome' || level === 'thread') this.disposeReplies();
    if (level === 'planet' || level === 'biome') this.setContext(null, null);
    else if (level === 'thread') this.setContext(this.ctxThread, null);
  }

  private disposeThreads(): void {
    if (!this.threads) return;
    for (const n of this.threads.nodes) this.raycast.unregister(n);
    this.root.scene.remove(this.threads.group);
    this.threads.dispose();
    this.threads = null;
  }

  private disposeComments(): void {
    if (!this.comments) return;
    for (const n of this.comments.nodes) this.raycast.unregister(n);
    this.root.scene.remove(this.comments.group);
    this.comments.dispose();
    this.comments = null;
  }

  private disposeReplies(): void {
    if (!this.replies) return;
    for (const n of this.replies.nodes) this.raycast.unregister(n);
    this.root.scene.remove(this.replies.group);
    this.replies.dispose();
    this.replies = null;
  }

  private setContext(thread: string | null, comment: string | null): void {
    this.ctxThread = thread;
    this.contextFn?.(thread, comment);
  }

  private onClick(ndc: THREE.Vector2): void {
    const hit = this.raycast.pick(ndc);
    this.selection.selected.set(hit?.payload ?? null);
    if (hit && hit.payload.kind === 'planet') this.zoom.surfaceTo(0);
  }

  private find(payload: SelectionPayload): Raycastable | null {
    switch (payload.kind) {
      case 'planet': return this.planet;
      case 'biome': return this.biomes.byId(payload.id) ?? null;
      case 'thread': return this.threads?.nodes.find((n) => n.payload.id === payload.id) ?? null;
      case 'comment': return this.comments?.byId(payload.id) ?? null;
      case 'reply': return this.replies?.byId(payload.id) ?? null;
      default: return null;
    }
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
      this.comments?.update(dt, t);
      this.replies?.update(dt, t);
      this.current.update(dt);
    });
  }
}
