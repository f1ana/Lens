import type { SectionBody } from '@/formats/shared/sections'
import { rowCount } from '@/formats/shared/sections'
import { isRecord } from '@/lib/is-record'
import type { Check, ConcealedRow } from '@/model/seed'

import { itemOf } from './checks'
import type { TwoShipLookups } from './lookups'

export interface WorkedOutHint {
  checkIds: string[]
  label: string
  text: string
}

const HINT_NOTE =
  'Gossip stone, paid and Saria’s Song hints are decided during play, so they aren’t listed.'

const UNKNOWN_LOCATION = 'in an Unknown Location'

// Granted at file start, so the game says "Link's pocket"
const STARTING_MASKS: ReadonlySet<string> = new Set([
  'RC_STARTING_ITEM_DEKU_MASK',
  'RC_STARTING_ITEM_SONG_OF_HEALING',
])

interface PlacementHint {
  // The game names every placement, not just the first
  all?: boolean
  item: string
  label: string
  lead: string
  option?: string
}

interface CheckHint {
  check: string
  label: string
  option: string
}

const HINTS: readonly (CheckHint | PlacementHint)[] = [
  {
    option: 'RO_HINTS_BOSS_REMAINS',
    label: 'Odolwa',
    item: 'RI_REMAINS_ODOLWA',
    lead: 'Last seen',
  },
  {
    option: 'RO_HINTS_BOSS_REMAINS',
    label: 'Goht',
    item: 'RI_REMAINS_GOHT',
    lead: 'Last seen',
  },
  {
    option: 'RO_HINTS_BOSS_REMAINS',
    label: 'Gyorg',
    item: 'RI_REMAINS_GYORG',
    lead: 'Last seen',
  },
  {
    option: 'RO_HINTS_BOSS_REMAINS',
    label: 'Twinmold',
    item: 'RI_REMAINS_TWINMOLD',
    lead: 'Last seen',
  },
  {
    option: 'RO_HINTS_TRANSFORMATIONS',
    label: "Butler's Son",
    item: 'RI_MASK_DEKU',
    lead: '',
    all: true,
  },
  {
    option: 'RO_HINTS_TRANSFORMATIONS',
    label: 'Darmani',
    item: 'RI_MASK_GORON',
    lead: '',
    all: true,
  },
  {
    option: 'RO_HINTS_TRANSFORMATIONS',
    label: 'Mikau',
    item: 'RI_MASK_ZORA',
    lead: '',
    all: true,
  },
  {
    option: 'RO_HINTS_HOOKSHOT',
    label: 'Hookshot',
    item: 'RI_HOOKSHOT',
    lead: 'Treasure',
  },
  {
    option: 'RO_HINTS_OATH_TO_ORDER',
    label: 'Oath to Order',
    item: 'RI_SONG_OATH',
    lead: 'Echoing',
  },
  {
    option: 'RO_HINTS_SONG_OF_SOARING',
    label: 'Song of Soaring',
    item: 'RI_SONG_SOARING',
    lead: 'Lies',
  },
  {
    option: 'RO_HINTS_SPIDER_HOUSES',
    label: 'Swamp Spider House',
    check: 'RC_SWAMP_SPIDER_HOUSE_MASK_OF_TRUTH',
  },
  {
    option: 'RO_HINTS_SPIDER_HOUSES',
    label: 'Oceanside Spider House',
    check: 'RC_OCEAN_SPIDER_HOUSE_WALLET',
  },
  {
    option: 'RO_HINTS_BANK_SIGN',
    label: 'Bank Reward',
    check: 'RC_CLOCK_TOWN_WEST_BANK_PIECE_OF_HEART',
  },
  { label: 'Gold Dust', item: 'RI_BOTTLE_GOLD_DUST', lead: 'Found' },
]

function byRank(lookups: TwoShipLookups): (a: string, b: string) => number {
  return (a, b) => {
    const [rankA, rankB] = [lookups.checkRank(a), lookups.checkRank(b)]
    // Not a subtraction, which gives NaN for two unknown checks
    if (rankA < rankB) return -1
    return rankA > rankB ? 1 : 0
  }
}

function placements(
  checks: Record<string, unknown>,
  lookups: TwoShipLookups,
): Map<string, string[]> {
  const byItem = new Map<string, string[]>()
  for (const [id, value] of Object.entries(checks)) {
    const item = itemOf(value)
    if (item === null) continue
    const ids = byItem.get(item)
    if (ids) ids.push(id)
    else byItem.set(item, [id])
  }
  const order = byRank(lookups)
  for (const ids of byItem.values()) ids.sort(order)
  return byItem
}

function isOn(options: Record<string, unknown>, option?: string): boolean {
  if (option === undefined) return true
  const value = options[option]
  return typeof value === 'number' && value !== 0
}

function workedOut(
  hint: CheckHint | PlacementHint,
  checks: Record<string, unknown>,
  byItem: Map<string, string[]>,
  lookups: TwoShipLookups,
): null | WorkedOutHint {
  if ('check' in hint) {
    const item = itemOf(checks[hint.check])
    if (item === null) return null
    return {
      label: hint.label,
      text: `Offers ${lookups.itemName(item)}`,
      checkIds: [hint.check],
    }
  }

  const found = byItem.get(hint.item) ?? []
  const checkIds = hint.all ? found : found.slice(0, 1)
  if (checkIds.length === 0) return null
  // The game drops the other locations once any placement is obtained
  const where =
    hint.all && checkIds.some((id) => STARTING_MASKS.has(id))
      ? "Link's pocket"
      : checkIds
          .map((id) => lookups.checkData(id)?.hintLocation ?? UNKNOWN_LOCATION)
          .join(' & ')
  return {
    label: hint.label,
    text: hint.lead === '' ? where : `${hint.lead} ${where}`,
    checkIds,
  }
}

export function readHints(
  log: Record<string, unknown>,
  lookups: TwoShipLookups,
): WorkedOutHint[] {
  const { options, checks } = log
  if (!isRecord(options) || !isRecord(checks)) return []

  const byItem = placements(checks, lookups)
  return HINTS.filter((hint) => isOn(options, hint.option)).flatMap((hint) => {
    const found = workedOut(hint, checks, byItem, lookups)
    return found ? [found] : []
  })
}

export function attachHints(hints: WorkedOutHint[], checks: Check[]): void {
  const byId = new Map(checks.map((check) => [check.id, check]))
  for (const { label, text, checkIds } of hints)
    for (const id of checkIds) byId.get(id)?.hints.push({ source: label, text })
}

export function hintsSection(hints: WorkedOutHint[]): null | SectionBody {
  if (hints.length === 0) return null

  const groups = hints.map(({ label, text }) => {
    const row: ConcealedRow = {
      kind: 'concealed',
      id: `hint|${label}`,
      primary: label,
      secondary: text,
    }
    return { title: label, rows: [row] }
  })
  return {
    note: HINT_NOTE,
    count: rowCount(groups),
    spoilerCount: true,
    content: {
      kind: 'rows',
      groupings: [{ id: 'type', label: 'Type', groups }],
    },
  }
}
