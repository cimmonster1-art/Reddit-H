// The contract every pickable world object exposes. Interaction code never
// reaches into scene internals — it only reads payloads and focus frames.
import type * as THREE from 'three';

export type SelectionKind = 'planet' | 'biome' | 'thread' | 'comment' | 'reply';

export interface SelectionPayload {
  kind: SelectionKind;
  id: string;
  label: string;
  /** Domain object the card layer interprets (Biome, Organ, ...). */
  data?: unknown;
}

/** A focus frame the camera can dolly to when diving into an object. */
export interface FocusFrame {
  center: THREE.Vector3;
  radius: number;
}

export interface Raycastable {
  /** Root pickable object; descendants are registered automatically. */
  readonly object: THREE.Object3D;
  readonly payload: SelectionPayload;
  focus(): FocusFrame;
}
