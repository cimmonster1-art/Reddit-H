/**
 * Design tokens for Substrate.
 *
 * CSS custom properties (for style.css) and Three.js hex values live here
 * together so the cold cyberpunk UI and the 3-D world speak one language.
 * The atlas accent (#27c4d9) is shared with the sibling cosmos project.
 */

export const CSS_VARS = {
  void: '--void', abyss: '--abyss', navy: '--navy', hairline: '--hairline',
  ink: '--ink', inkDim: '--ink-dim', inkFaint: '--ink-faint', accent: '--accent',
} as const;
export type CssVar = typeof CSS_VARS[keyof typeof CSS_VARS];

/** Cold palette mirrored into Three.js hex. */
export const COLOR = {
  void0: 0x02040a, abyss: 0x04070f, navy: 0x0a1322, crust: 0x10243a,
  oxygen: 0xaee3ff, lift: 0xffb347, nerve: 0x7c8cff, storm: 0xff5d73,
  spore: 0xb78bff, gold: 0xffd98a, accent: 0x27c4d9, accentDim: 0x0e7c8c,
  ink: 0xe6edf5, inkDim: 0x8293a8,
} as const;
export type ColorKey = keyof typeof COLOR;

export const FONT = {
  sans: '"Space Grotesk", "Inter", system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
} as const;

export const SPACE = { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px' } as const;
