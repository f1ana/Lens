import { rowsBy } from '@/formats/shared/check-rows'
import type { SectionBody } from '@/formats/shared/sections'
import { isRecord } from '@/lib/is-record'
import type { Check } from '@/model/seed'

import type { CheckData, LighthouseLookups } from './lookups'
import { UNKNOWN } from './lookups'

const UNKNOWN_ITEM = 'Unknown item'
const MOLEHILL = 'RI_MOLEHILL'

interface Placement {
  collection?: number
  item: number
  origin?: number
  own?: number
}

function numberAt(value: unknown[], index: number): number | undefined {
  const n = value[index]
  return typeof n === 'number' ? n : undefined
}

function placementOf(value: unknown): null | Placement {
  if (!Array.isArray(value)) return null
  const entries = value as unknown[]
  const item = numberAt(entries, 1)
  if (item === undefined) return null
  return {
    own: numberAt(entries, 0),
    item,
    origin: numberAt(entries, 2),
    collection: numberAt(entries, 3),
  }
}

function itemName(placement: Placement, lookups: LighthouseLookups): string {
  const item = lookups.itemByNumber(placement.item)
  if (!item) return `${UNKNOWN_ITEM} ${String(placement.item)}`
  if (item.code === MOLEHILL && placement.collection !== undefined)
    return lookups.abilityName(placement.collection) ?? item.name
  return item.name
}

// Where the item normally sits, when the log names a real check
function homeOf(
  placement: Placement,
  lookups: LighthouseLookups,
): CheckData | undefined {
  const { origin, own } = placement
  if (origin === undefined || origin === 0 || origin === own) return undefined
  return lookups.checkByNumber(origin)
}

function itemText(value: unknown, lookups: LighthouseLookups): string {
  const placement = placementOf(value)
  if (!placement) return UNKNOWN_ITEM
  const name = itemName(placement, lookups)
  const home = homeOf(placement, lookups)
  return home ? `${name}, normally at ${home.name} (${home.world})` : name
}

function readCheck(
  code: string,
  value: unknown,
  lookups: LighthouseLookups,
): Check {
  const data = lookups.checkByCode(code)
  const name = data?.name ?? code
  const item = itemText(value, lookups)
  return {
    id: code,
    name,
    item,
    tags: [],
    hints: [],
    searchText: [name, data?.world, item]
      .filter((part) => part !== undefined)
      .join(' ')
      .toLowerCase(),
  }
}

export function readChecks(
  log: Record<string, unknown>,
  lookups: LighthouseLookups,
): Check[] {
  const checks = isRecord(log.checks) ? log.checks : {}
  return Object.entries(checks).map(([code, value]) =>
    readCheck(code, value, lookups),
  )
}

export function checksSection(
  log: Record<string, unknown>,
  checks: Check[],
  lookups: LighthouseLookups,
): SectionBody {
  if (log.checks !== undefined && !isRecord(log.checks))
    throw new Error('checks is not an object')

  const data = (check: Check) => lookups.checkByCode(check.id)
  const byWorld = rowsBy(checks, (c) => data(c)?.world ?? UNKNOWN)
  const typeTitle = (type: string, world: string) => `${type}: ${world}`
  const byType = rowsBy(checks, (c) => {
    const found = data(c)
    return found ? typeTitle(found.type, found.world) : UNKNOWN
  })
  const typeOrder = lookups.typeOrder.flatMap((type) =>
    lookups.worldOrder.map((world) => typeTitle(type, world)),
  )

  return {
    count: checks.length,
    content: {
      kind: 'rows',
      groupings: [
        {
          id: 'world',
          label: 'World',
          groups: byWorld.groups(lookups.worldOrder, UNKNOWN),
        },
        {
          id: 'type',
          label: 'Type',
          groups: byType.groups(typeOrder, UNKNOWN),
        },
      ],
    },
  }
}
