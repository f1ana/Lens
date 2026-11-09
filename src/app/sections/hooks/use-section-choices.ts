import { useCallback, useEffect, useMemo, useState } from 'react'

import { lastingChoices } from '@/app/shared/utils/reveal'
import type { Seed } from '@/model/seed'
import { loadGroupings, saveGroupings } from '@/storage/groupings'

export function useSectionChoices(seed: Seed) {
  const [groupings, setGroupings] = useState(() =>
    lastingChoices(seed, loadGroupings()),
  )
  // Per log only: a sphere number means nothing in the next one
  const [groupTitles, setGroupTitles] = useState<
    Record<string, string | undefined>
  >({})

  useEffect(() => {
    // Merged, so a choice that doesn't last leaves the saved one in place
    saveGroupings({ ...loadGroupings(), ...lastingChoices(seed, groupings) })
  }, [seed, groupings])

  const onGroupTitleChange = useCallback(
    (sectionId: string, title: string | undefined) =>
      setGroupTitles((current) => ({ ...current, [sectionId]: title })),
    [],
  )

  const onGroupingChange = useCallback(
    (sectionId: string, groupingId: string) => {
      setGroupings((current) => ({ ...current, [sectionId]: groupingId }))
      // The new arrangement has other groups
      onGroupTitleChange(sectionId, undefined)
    },
    [onGroupTitleChange],
  )

  return useMemo(
    () => ({ groupings, groupTitles, onGroupingChange, onGroupTitleChange }),
    [groupings, groupTitles, onGroupingChange, onGroupTitleChange],
  )
}
