import type { Check, CheckRow, Grouping } from '@/model/seed'

import { Buckets } from './buckets'
import type { SectionBody } from './sections'
import { singleGrouping } from './sections'

export function checkRow(check: Check): CheckRow {
  return {
    kind: 'check',
    id: check.id,
    primary: check.name,
    checkId: check.id,
  }
}

export function rowsBy(
  checks: Check[],
  titleOf: (check: Check) => string,
): Buckets {
  const buckets = new Buckets()
  for (const check of checks) buckets.add(titleOf(check), checkRow(check))
  return buckets
}

export function hintedGrouping(checks: Check[]): Grouping {
  const buckets = rowsBy(checks, (c) =>
    c.hints.length > 0 ? 'Hinted' : 'Not hinted',
  )
  return {
    id: 'hinted',
    label: 'Hinted',
    groups: buckets.groups(['Hinted', 'Not hinted']),
    perLog: true,
  }
}

// Flat, because the Checks section already files songs by area
export function songsSection(
  checks: Check[],
  holdsSong: (check: Check) => boolean,
): null | SectionBody {
  const songs = checks.filter(holdsSong)
  if (songs.length === 0) return null
  return {
    count: songs.length,
    content: {
      kind: 'rows',
      groupings: [singleGrouping([{ rows: songs.map(checkRow) }])],
    },
  }
}
