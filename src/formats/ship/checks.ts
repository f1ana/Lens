import { hintedGrouping, rowsBy } from '@/formats/shared/check-rows'
import type { SectionBody } from '@/formats/shared/sections'
import { isRecord } from '@/lib/is-record'
import type { Check, Grouping, RowGroup } from '@/model/seed'

import { OTHER_AREA } from './areas'
import { OTHER_TYPE } from './check-types'
import type { ShipLookups } from './lookups'

const UNKNOWN_ITEM = 'Unknown item'
const NOT_IN_PLAYTHROUGH = 'Not in the playthrough'

const SONGS: ReadonlySet<string> = new Set([
  "Zelda's Lullaby",
  "Epona's Song",
  "Saria's Song",
  "Sun's Song",
  'Song of Time',
  'Song of Storms',
  'Minuet of Forest',
  'Bolero of Fire',
  'Serenade of Water',
  'Requiem of Spirit',
  'Nocturne of Shadow',
  'Prelude of Light',
])

// An ice trap holds its own name here, not the item it pretends to be
export function holdsSong(check: Check): boolean {
  return SONGS.has(check.item)
}

function readCheck(name: string, value: unknown, lookups: ShipLookups): Check {
  let item = UNKNOWN_ITEM
  let price: string | undefined
  let disguise: string | undefined

  if (typeof value === 'string') {
    item = value
  } else if (isRecord(value)) {
    if (typeof value.item === 'string') item = value.item
    if (typeof value.price === 'number') price = `${value.price} rupees`
    if (typeof value.trickName === 'string') disguise = value.trickName
  }

  const searchText = [name, lookups.areaOf(name), item, disguise]
    .filter((part) => part !== undefined)
    .join(' ')
    .toLowerCase()

  return {
    id: name,
    name,
    item,
    price,
    disguise,
    tags: [],
    hints: [],
    searchText,
  }
}

function sphereTitle(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1)
}

/*
 * Adds a tag such as "Sphere 11" to each check in the playthrough. A
 * playthrough check that `checks` lacks is added, so a sphere row always has
 * a check to hide its item behind.
 */
function addSpheres(
  log: Record<string, unknown>,
  checks: Check[],
  lookups: ShipLookups,
): void {
  const { playthrough } = log
  if (!isRecord(playthrough)) return
  const byName = new Map(checks.map((check) => [check.name, check]))
  for (const [sphere, entries] of Object.entries(playthrough)) {
    if (!isRecord(entries)) continue
    for (const [name, value] of Object.entries(entries)) {
      let check = byName.get(name)
      if (!check) {
        check = readCheck(name, value, lookups)
        byName.set(name, check)
        checks.push(check)
      }
      check.tags.push(sphereTitle(sphere))
    }
  }
}

export function readChecks(
  log: Record<string, unknown>,
  lookups: ShipLookups,
): Check[] {
  const locations = isRecord(log.locations) ? log.locations : {}
  const checks = Object.entries(locations).map(([name, value]) =>
    readCheck(name, value, lookups),
  )
  addSpheres(log, checks, lookups)
  return checks
}

function sphereGrouping(checks: Check[]): Grouping {
  const buckets = rowsBy(checks, (c) => c.tags[0] ?? NOT_IN_PLAYTHROUGH)
  return {
    id: 'sphere',
    label: 'Sphere',
    groups: buckets.groups([], NOT_IN_PLAYTHROUGH),
    perLog: true,
  }
}

// A No Logic playthrough holds nothing but its win condition
function isNoLogic(log: Record<string, unknown>): boolean {
  const { settings } = log
  return isRecord(settings) && settings['No Logic'] === 'On'
}

export function checksSection(
  log: Record<string, unknown>,
  checks: Check[],
  lookups: ShipLookups,
): SectionBody {
  if (log.locations !== undefined && !isRecord(log.locations))
    throw new Error('locations is not an object')

  const byArea = rowsBy(checks, (c) => lookups.areaOf(c.name))
  const byType = rowsBy(checks, (c) => lookups.checkTypeOf(c.name))
  return {
    count: checks.length,
    content: {
      kind: 'rows',
      groupings: [
        {
          id: 'area',
          label: 'Area',
          groups: byArea.groups(lookups.areaOrder, OTHER_AREA),
        },
        { id: 'type', label: 'Type', groups: byType.groups([], OTHER_TYPE) },
        ...(isNoLogic(log) ? [] : [sphereGrouping(checks)]),
        hintedGrouping(checks),
      ],
    },
  }
}

export function spheresSection(
  log: Record<string, unknown>,
): null | SectionBody {
  const { playthrough } = log
  if (playthrough === undefined) return null
  if (!isRecord(playthrough)) throw new Error('playthrough is not an object')
  if (isNoLogic(log)) return null

  const groups: RowGroup[] = []
  for (const [sphere, entries] of Object.entries(playthrough)) {
    if (!isRecord(entries)) continue
    const rows = Object.keys(entries).map((name) => ({
      kind: 'concealed-check' as const,
      id: `${sphere}|${name}`,
      primary: name,
      checkId: name,
    }))
    if (rows.length > 0) groups.push({ title: sphereTitle(sphere), rows })
  }

  if (groups.length === 0) return null
  return {
    count: groups.length,
    spoilerCount: true,
    content: {
      kind: 'rows',
      // Not by area: a heading would say where each hidden check is
      groupings: [{ id: 'sphere', label: 'Sphere', groups }],
    },
  }
}
