/**
 * Design tokens for Substrate.
 *
 * CSS custom properties (for style.css) and Three.js hex values live here
 * together so the glass UI and the 3-D world always speak one colour
 * language. The Bio-Galaxy atlas accent (#27c4d9) is included as `accent`
 * so the two projects share a visual through-line when assets cross over.
 */

export const CSS_VARS = {
  bg: '--bg', bg2: '--bg2', glass: '--glass', glassLine: '--glass-line',
  ink: '--ink', inkDim: '--ink-dim', oxygen: '--oxygen', lift: '--lift',
  nerve: '--nerve', storm: '--storm', spore: '--spore', gold: '--gold',
  radius: '--radius',
} as const;
export type CssVar = typeof CSS_VARS[keyof typeof CSS_VARS];

/** Mirrors client/game/palette.ts + the Bio-Galaxy atlas accent. */
export const COLOR = {
  void0: 0x05060d, void1: 0x0a0d1f, crust: 0x1a2348, glass: 0x14182e,
  oxygen: 0xaee3ff, lift: 0xffb347, nerve: 0x7c8cff, storm: 0xff5d73,
  spore: 0xb78bff, gold: 0xffd98a, accent: 0x27c4d9, accentDim: 0x0e7c8c,
} as const;
export type ColorKey = keyof typeof COLOR;

export const FONT = {
  sans: '"Space Grotesk", "Inter", system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
} as const;

export const RADIUS = { sm: '10px', md: '16px', lg: '24px', pill: '999px' } as const;
export const SPACE = { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px' } as const;

/** Inline-style object for the standard glass panel. */
export function glassStyle(opacity = 0.55): Record<string, string> {
  return {
    background: `rgba(20, 24, 46, ${opacity})`,
    border: '1px solid rgba(140, 160, 255, 0.18)',
    backdropFilter: 'blur(14px) saturate(1.2)',
    borderRadius: RADIUS.md,
    boxShadow: '0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
  };
}
