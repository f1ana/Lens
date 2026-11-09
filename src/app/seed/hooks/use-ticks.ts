import { useCallback, useEffect, useMemo, useState } from 'react'

import { revealableIds } from '@/app/shared/utils/reveal'
import type { Seed } from '@/model/seed'
import { loadTicks, saveTicks } from '@/storage/last-log'

export function useTicks(seed: Seed) {
  // SeedView is keyed by the log, so each log starts from its own ticks
  const [ticked, setTicked] = useState(() => new Set(loadTicks(seed.key)))
  const revealable = useMemo(() => revealableIds(seed), [seed])
  const canReveal = revealable.length > 0
  const allTicked = canReveal && revealable.every((id) => ticked.has(id))

  useEffect(() => {
    saveTicks(seed.key, [...ticked])
  }, [seed.key, ticked])

  const toggle = useCallback((id: string) => {
    setTicked((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }, [])

  const toggleAll = () => {
    setTicked(allTicked ? new Set() : new Set(revealable))
  }

  return { ticked, canReveal, allTicked, toggle, toggleAll }
}
