import type { SelectionPayload } from '../raycastable.js';

// Tiny observable for hover + selection state. Rendering and UI both subscribe;
// neither mutates the other directly (no cross-wiring spaghetti).
type Sub<T> = (value: T | null, previous: T | null) => void;

class Slot<T> {
  private value: T | null = null;
  private subs = new Set<Sub<T>>();
  get(): T | null { return this.value; }
  set(next: T | null): void {
    if (next === this.value) return;
    const prev = this.value;
    this.value = next;
    for (const fn of this.subs) fn(next, prev);
  }
  subscribe(fn: Sub<T>): () => void {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }
}

export class SelectionStore {
  readonly hovered = new Slot<SelectionPayload>();
  readonly selected = new Slot<SelectionPayload>();
}
