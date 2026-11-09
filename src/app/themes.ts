import type { GameTheme } from '@/model/seed'

export type ThemeId = 'landing' | GameTheme

/*
 * Browser chrome can't read CSS variables, so these repeat each theme's
 * `--background` from index.css
 */
export const THEME_COLORS: Record<ThemeId, string> = {
  landing: '#010c0c',
  ship: '#020c05',
  '2ship': '#0a0415',
  lighthouse: '#001018',
}
