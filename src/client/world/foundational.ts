// The illusion of all-Reddit: a curated anatomy of foundational subreddits that
// form the planet's major biomes. The live home subreddit is injected as a
// highlighted biome at render time (see SubstrateController). Data only — no
// rendering, no Three.js — so it stays trivially editable.

export type BiomeArchetype =
  | 'reef'      // meme-heavy — coral / fungal bloom
  | 'forest'    // advice / support — mycelial forest
  | 'cortex'    // news / debate — inflamed neural cortex
  | 'garden'    // wholesome / hobby — organ garden
  | 'colony'    // fandom / culture — glowing colony
  | 'core';     // science / reference — dense crystalline core

export interface FoundationalBiome {
  id: string;
  sub: string;        // subreddit name without r/
  label: string;      // display label
  archetype: BiomeArchetype;
  hue: number;        // 0..360 stable tint
  weight: number;     // 0..1 relative size
  lat: number;        // degrees -80..80
  lon: number;        // degrees -180..180
  blurb: string;      // shown in the biome card (show-don't-tell language)
}

export const FOUNDATIONAL_BIOMES: FoundationalBiome[] = [
  { id: 'b-askreddit', sub: 'AskReddit', label: 'AskReddit', archetype: 'cortex', hue: 268, weight: 1.0, lat: 18, lon: -28,
    blurb: 'A vast neural cortex, always firing — the planet’s busiest thinking tissue.' },
  { id: 'b-gaming', sub: 'gaming', label: 'gaming', archetype: 'reef', hue: 196, weight: 0.86, lat: -22, lon: 46,
    blurb: 'A luminous reef of memes and clips, spawning and dissolving by the hour.' },
  { id: 'b-aww', sub: 'aww', label: 'aww', archetype: 'garden', hue: 96, weight: 0.7, lat: 44, lon: 120,
    blurb: 'A warm organ garden — high oxygen, low inflammation, gentle currents.' },
  { id: 'b-worldnews', sub: 'worldnews', label: 'worldnews', archetype: 'cortex', hue: 8, weight: 0.82, lat: -8, lon: 158,
    blurb: 'A storm belt of debate — inflamed, electric, constantly weather-beaten.' },
  { id: 'b-science', sub: 'science', label: 'science', archetype: 'core', hue: 174, weight: 0.64, lat: 62, lon: -120,
    blurb: 'A dense crystalline core where slow, heavy structures accrete.' },
  { id: 'b-movies', sub: 'movies', label: 'movies', archetype: 'colony', hue: 42, weight: 0.6, lat: -52, lon: -86,
    blurb: 'A glowing culture colony — fandom blooms pulsing in waves.' },
  { id: 'b-todayilearned', sub: 'todayilearned', label: 'todayilearned', archetype: 'forest', hue: 142, weight: 0.58, lat: 6, lon: 88,
    blurb: 'A mycelial forest threading facts between every other biome.' },
];
