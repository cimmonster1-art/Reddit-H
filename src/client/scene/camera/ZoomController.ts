import type { CameraController } from './CameraController.js';
import type { FocusFrame, SelectionPayload } from '../raycastable.js';

// The endless-zoom ladder as an explicit state machine. Diving pushes a level
// onto a breadcrumb stack; surfacing pops it. comment/reply are part of the
// ladder now so deeper layers can attach without reshaping this file.
export const ZOOM_LEVELS = ['planet', 'biome', 'thread', 'comment', 'reply'] as const;
export type ZoomLevel = typeof ZOOM_LEVELS[number];

export interface Crumb {
  level: ZoomLevel;
  label: string;
  frame: FocusFrame;
  payload?: SelectionPayload;
}

type Listener = (level: ZoomLevel, crumbs: Crumb[]) => void;

export class ZoomController {
  private stack: Crumb[] = [];
  private listeners = new Set<Listener>();

  constructor(private camera: CameraController, planet: FocusFrame) {
    this.stack.push({ level: 'planet', label: 'Reddit', frame: planet });
  }

  get level(): ZoomLevel { return this.stack[this.stack.length - 1].level; }
  get crumbs(): Crumb[] { return [...this.stack]; }

  onChange(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Dive one rung toward the given selection. */
  dive(payload: SelectionPayload, frame: FocusFrame): void {
    const next = this.childLevel();
    if (!next) return;
    this.stack.push({ level: next, label: payload.label, frame, payload });
    this.apply();
  }

  /** Pop back to a breadcrumb index (0 = planet). */
  surfaceTo(index: number): void {
    if (index < 0 || index >= this.stack.length - 1) return;
    this.stack = this.stack.slice(0, index + 1);
    this.apply();
  }

  surface(): void { this.surfaceTo(this.stack.length - 2); }

  private childLevel(): ZoomLevel | null {
    const i = ZOOM_LEVELS.indexOf(this.level);
    return i < ZOOM_LEVELS.length - 1 ? ZOOM_LEVELS[i + 1] : null;
  }

  private apply(): void {
    const top = this.stack[this.stack.length - 1];
    this.camera.frameOn(top.frame.center, top.frame.radius);
    for (const fn of this.listeners) fn(this.level, this.crumbs);
  }
}
