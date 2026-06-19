/**
 * Design tokens for Reddit-H.
 *
 * CSS custom properties (for style.css) and Three.js hex values (for
 * palette.ts / OrganismScene) live here together so the glass UI and the
 * 3-D world always speak the same colour language.
 *
 * Bio-Galaxy accent (#27c4d9) is pulled in as `accent` / `COLOR.accent`
 * so the two projects share a visual through-line when assets cross over.
 */

// ─── CSS variable names ────────────────────────────────────────────────────
/** Matches every --var declared in src/client/style.css */
export const CSS_VARS = {
  bg:         '--bg',
  bg2:        '--bg2',
  glass:      '--glass',
  glassLine:  '--glass-line',
  ink:        '--ink',
  inkDim:     '--ink-dim',
  oxygen:     '--oxygen',
  lift:       '--lift',
  nerve:      '--nerve',
  storm:      '--storm',
  spore:      '--spore',
  gold:       '--gold',
  radius:     '--radius',
} as const;

export type CssVar = typeof CSS_VARS[keyof typeof CSS_VARS];

// ─── Hex palette (Three.js / canvas) ──────────────────────────────────────
/** Mirrors palette.ts + adds the Bio-Galaxy atlas accent. */
export const COLOR = {
  // void depths
  void0:   0x05060d,
  void1:   0x0a0d1f,
  // structural
  crust:   0x1a2348,
  glass:   0x14182e,
  // semantic tones
  oxygen:  0xaee3ff,
  lift:    0xffb347,
  nerve:   0x7c8cff,
  storm:   0xff5d73,
  spore:   0xb78bff,
  gold:    0xffd98a,
  // bio-galaxy bridge — atlas cyan accent
  accent:  0x27c4d9,
  accentDim: 0x0e7c8c,
} as const;

export type ColorKey = keyof typeof COLOR;

// ─── Typography ────────────────────────────────────────────────────────────
export const FONT = {
  sans: '"Space Grotesk", "Inter", system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
} as const;

// ─── Spacing / radii ───────────────────────────────────────────────────────
export const RADIUS = {
  sm:   '10px',
  md:   '16px',   // matches --radius
  lg:   '24px',
  pill: '999px',
} as const;

export const SPACE = {
  xs:  '4px',
  sm:  '8px',
  md:  '12px',
  lg:  '16px',
  xl:  '24px',
} as const;

// ─── Glass layer helper ────────────────────────────────────────────────────
/**
 * Returns an inline-style object for the standard glass panel.
 * Usage: `Object.assign(el.style, glassStyle())`
 */
export function glassStyle(opacity = 0.55): Record<string, string> {
  return {
    background:      `rgba(20, 24, 46, ${opacity})`,
    border:          '1px solid rgba(140, 160, 255, 0.18)',
    backdropFilter:  'blur(14px) saturate(1.2)',
    borderRadius:    RADIUS.md,
    boxShadow:       '0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
  };
}
