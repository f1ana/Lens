import type { Seed } from '@/model/seed'
import { hasRows, isConcealed, revealKey } from '@/model/seed'
import type { GroupingChoices } from '@/storage/groupings'

// Drops per-log choices, whose headings would spoil the next log
export function lastingChoices(
  seed: Seed,
  choices: GroupingChoices,
): GroupingChoices {
  const perLog = new Set(
    seed.sections.flatMap(({ id, content }) =>
      hasRows(content)
        ? content.groupings
            .filter((grouping) => grouping.perLog)
            .map((grouping) => `${id}|${grouping.id}`)
        : [],
    ),
  )
  return Object.fromEntries(
    Object.entries(choices).filter(
      ([sectionId, groupingId]) => !perLog.has(`${sectionId}|${groupingId}`),
    ),
  )
}

export function revealableIds(seed: Seed): string[] {
  const ids = new Set(seed.checks.map((check) => check.id))
  for (const { content } of seed.sections)
    if (hasRows(content))
      for (const group of content.groupings[0].groups)
        for (const row of group.rows)
          if (isConcealed(row)) ids.add(revealKey(row))
  return [...ids]
}
