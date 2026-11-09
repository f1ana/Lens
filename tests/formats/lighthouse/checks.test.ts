import { checksSection, readChecks } from '@/formats/lighthouse/checks'
import type { Check, Grouping, RowGroup } from '@/model/seed'
import { hasRows } from '@/model/seed'

import { fixture } from '../../helpers'
import { lookups } from './data-1.2.2'

const ALL = fixture('lighthouse-1.2.2-all-shuffles.json')
const NO_LOGIC = fixture('lighthouse-1.2.2-no-logic.json')

function checksOf(log: Record<string, unknown>): Check[] {
  return readChecks(log, lookups)
}

function itemAt(log: Record<string, unknown>, code: string): string {
  const check = checksOf(log).find((c) => c.id === code)
  if (!check) throw new Error(`no ${code}`)
  return check.item
}

function grouping(log: Record<string, unknown>, id: string): Grouping {
  const { content } = checksSection(log, checksOf(log), lookups)
  if (!hasRows(content)) throw new Error('no rows')
  const found = content.groupings.find((g) => g.id === id)
  if (!found) throw new Error(`no grouping ${id}`)
  return found
}

function group(groups: RowGroup[], title: string): RowGroup {
  const found = groups.find((g) => g.title === title)
  if (!found) throw new Error(`no group ${title}`)
  return found
}

function oneCheck(value: unknown): string {
  return itemAt(
    { checks: { RC_BGS_JIGGY_CROCTUS: value } },
    'RC_BGS_JIGGY_CROCTUS',
  )
}

it('names a molehill by the ability it teaches, and where it normally sits', () => {
  expect(itemAt(ALL, 'RC_BGS_MOLEHILL_WADING_BOOTS')).toBe(
    'Claw Swipe, normally at Molehill Attack (Spiral Mountain)',
  )
})

it('says where an item normally sits', () => {
  expect(itemAt(ALL, 'RC_BGS_JIGGY_HUTS')).toBe(
    'Jiggy, normally at Jiggy Inside The Wells Bucket (Mad Monster Mansion)',
  )
})

it('shows the No Logic dummy item as Unknown, with no home', () => {
  expect(itemAt(NO_LOGIC, 'RC_CC_NOTE_TOP_OF_CLANKER_5')).toBe('Unknown')
})

it('names checks as the game does and finds them by world', () => {
  const croctus = checksOf(ALL).find((c) => c.id === 'RC_BGS_JIGGY_CROCTUS')
  expect(croctus?.name).toBe('Jiggy Croctus')
  expect(croctus?.searchText).toContain('bubblegloop swamp')
})

it('lets search find where an item normally sits', () => {
  const holder = checksOf(ALL).find((c) =>
    c.item.includes('normally at Jiggy Croctus'),
  )
  expect(holder?.searchText).toContain('jiggy croctus')
})

it.each([
  ['world', ALL],
  ['world', NO_LOGIC],
  ['type', ALL],
  ['type', NO_LOGIC],
])('shows RC_UNKNOWN by its code in the Unknown group by %s', (id, log) => {
  const groups = grouping(log, id).groups
  expect(groups.at(-1)?.title).toBe('Unknown')
  expect(group(groups, 'Unknown').rows.map((r) => r.primary)).toEqual([
    'RC_UNKNOWN',
  ])
})

it('groups by world in pause-menu order', () => {
  const groups = grouping(ALL, 'world').groups
  expect(groups).toHaveLength(12)
  expect(groups[0]?.title).toBe('Spiral Mountain')
})

it('groups by type and world', () => {
  const all = grouping(ALL, 'type').groups
  expect(all).toHaveLength(62)
  expect(all[0]?.title).toBe('Empty Honeycomb: Spiral Mountain')
  expect(group(all, 'Jiggy: Bubblegloop Swamp').rows).toHaveLength(10)
  expect(grouping(NO_LOGIC, 'type').groups).toHaveLength(46)
})

it.each([
  ['world', 'all shuffles', ALL],
  ['world', 'no logic', NO_LOGIC],
  ['type', 'all shuffles', ALL],
  ['type', 'no logic', NO_LOGIC],
])('never puts two rows of one name in a group by %s (%s)', (id, _, log) => {
  for (const { rows } of grouping(log, id).groups) {
    const names = rows.map((r) => r.primary)
    expect(new Set(names).size).toBe(names.length)
  }
})

it('counts every check, defaulting to the world grouping', () => {
  const section = checksSection(ALL, checksOf(ALL), lookups)
  expect(section.count).toBe(1208)
  if (!hasRows(section.content)) throw new Error('no rows')
  expect(section.content.groupings.map((g) => g.id)).toEqual(['world', 'type'])
})

it('fails on checks that are not an object', () => {
  expect(() => checksSection({ checks: 42 }, [], lookups)).toThrow(
    'checks is not an object',
  )
})

it.each([['RI_JIGGY'], [null], [[3]], [[3, 'x']]])(
  'shows %j as an unknown item',
  (value) => {
    expect(oneCheck(value)).toBe('Unknown item')
  },
)

it('shows an item Lens has no data for by its number', () => {
  expect(oneCheck([3, 99, 0, 0])).toBe('Unknown item 99')
})

it('falls back to the item name for an ability Lens has no data for', () => {
  expect(oneCheck([3, 8, 0, 99])).toBe('New Ability')
})

it.each([[[3, 2, 0, 0]], [[3, 2, 3, 0]], [[3, 2, 5000, 0]]])(
  'adds no home for the origin in %j',
  (value) => {
    expect(oneCheck(value)).toBe('Jiggy')
  },
)

it('shows a check Lens has no data for by its code', () => {
  const [check] = checksOf({ checks: { RC_NEW_THING: [9999, 2, 0, 0] } })
  expect(check?.name).toBe('RC_NEW_THING')
})
