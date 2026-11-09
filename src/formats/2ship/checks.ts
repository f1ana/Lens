import { Buckets } from '@/formats/shared/buckets'
import { checkRow, hintedGrouping, rowsBy } from '@/formats/shared/check-rows'
import type { SectionBody } from '@/formats/shared/sections'
import { isRecord } from '@/lib/is-record'
import type { Check } from '@/model/seed'

import type { TwoShipLookups } from './lookups'
import { OTHER, readableName } from './lookups'

const UNKNOWN_ITEM = 'Unknown item'
const JUNK = 'RI_JUNK'

export function itemOf(value: unknown): null | string {
  if (typeof value === 'string') return value
  if (isRecord(value) && typeof value.randoItemId === 'string')
    return value.randoItemId
  return null
}

function isSong(code: string): boolean {
  return code.startsWith('RI_SONG_') || code === 'RI_PROGRESSIVE_LULLABY'
}

// By code, because a check keeps only the item's name
export function songHolders(log: Record<string, unknown>): Set<string> {
  const checks = isRecord(log.checks) ? log.checks : {}
  return new Set(
    Object.entries(checks).flatMap(([id, value]) => {
      const code = itemOf(value)
      return code !== null && isSong(code) ? [id] : []
    }),
  )
}

function rupees(price: number): string {
  return `${String(price)} ${price === 1 ? 'rupee' : 'rupees'}`
}

function readCheck(
  code: string,
  value: unknown,
  lookups: TwoShipLookups,
): Check {
  const data = lookups.checkData(code)
  const name = data?.name ?? readableName(code, 'RC_')
  const itemCode = itemOf(value)
  const item = itemCode === null ? UNKNOWN_ITEM : lookups.itemName(itemCode)
  const price =
    isRecord(value) && typeof value.price === 'number'
      ? rupees(value.price)
      : undefined

  return {
    id: code,
    name,
    item,
    price,
    tags: [],
    hints: [],
    searchText: [name, ...(data?.areas ?? []), item].join(' ').toLowerCase(),
  }
}

export function readChecks(
  log: Record<string, unknown>,
  lookups: TwoShipLookups,
): Check[] {
  const checks = isRecord(log.checks) ? log.checks : {}
  return Object.entries(checks).map(([code, value]) =>
    readCheck(code, value, lookups),
  )
}

// One row per area, because a check can be reached from several
function areaBuckets(checks: Check[], lookups: TwoShipLookups): Buckets {
  const buckets = new Buckets()
  for (const check of checks) {
    const areas = lookups.checkData(check.id)?.areas ?? []
    for (const area of areas.length > 0 ? areas : [OTHER])
      buckets.add(area, { ...checkRow(check), id: `${area}|${check.id}` })
  }
  return buckets
}

export function checksSection(
  log: Record<string, unknown>,
  checks: Check[],
  lookups: TwoShipLookups,
): SectionBody {
  if (log.checks !== undefined && !isRecord(log.checks))
    throw new Error('checks is not an object')

  const byType = rowsBy(checks, (c) => lookups.checkData(c.id)?.type ?? OTHER)
  const hasJunk = Object.values(log.checks ?? {}).some(
    (value) => itemOf(value) === JUNK,
  )
  return {
    count: checks.length,
    note: hasJunk
      ? 'Junk stays unnamed because the game picks it during play.'
      : undefined,
    content: {
      kind: 'rows',
      groupings: [
        {
          id: 'area',
          label: 'Area',
          groups: areaBuckets(checks, lookups).groups(lookups.areaOrder, OTHER),
        },
        { id: 'type', label: 'Type', groups: byType.groups([], OTHER) },
        ...(checks.some((c) => c.hints.length > 0)
          ? [hintedGrouping(checks)]
          : []),
      ],
    },
  }
}
