import { useEffect } from 'react'

import type { ThemeId } from '@/app/themes'
import { THEME_COLORS } from '@/app/themes'

export function useGameTheme(theme: ThemeId): void {
  useEffect(() => {
    document.documentElement.dataset.game = theme
    for (const meta of document.querySelectorAll('meta[name="theme-color"]'))
      meta.setAttribute('content', THEME_COLORS[theme])
  }, [theme])
}
