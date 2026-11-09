import { filterRows, matchesText } from '@/app/rows/utils/search'
import type { Check, Row, RowGroup } from '@/model/seed'

import { open, rowsOf, sectionById } from '../helpers'

function check(name: string, item: string, extra: Partial<Check> = {}): Check {
  return {
    id: name,
    name,
    item,
    tags: [],
    hints: [],
    searchText: [name, item, extra.disguise]
      .filter((part) => part !== undefined)
      .join(' ')
      .toLowerCase(),
    ...extra,
  }
}

function row(id: string): Row {
  return { kind: 'check', id, primary: id, checkId: id }
}

function ids(groups: RowGroup[]): string[] {
  return groups.flatMap((group) => group.rows.map((r) => r.id))
}

const checks = new Map([
  ['a', check('DMC Upper Grotto Chest', 'Progressive Bow')],
  ['b', check('KF Chest', 'Deku Nuts')],
])

it('matches check names and hidden contents, ignoring case', () => {
  const groups = [{ rows: [row('a'), row('b')] }]
  expect(ids(filterRows(groups, checks, 'BOW', new Set()))).toEqual(['a'])
  expect(ids(filterRows(groups, checks, 'grotto', new Set()))).toEqual(['a'])
})

it('matches the fake name of an ice trap', () => {
  const trap = check('GC Chest', 'Ice Trap', { disguise: 'Fairy Bow' })
  expect(
    ids(
      filterRows(
        [{ rows: [row('a')] }],
        new Map([['a', trap]]),
        'fairy',
        new Set(),
      ),
    ),
  ).toEqual(['a'])
})

it('filters plain rows by both text fields and drops empty groups', () => {
  const groups = [
    {
      title: 'A',
      rows: [
        {
          kind: 'plain' as const,
          id: '1',
          primary: 'Rainbow Bridge',
          secondary: 'Open',
        },
      ],
    },
    {
      title: 'B',
      rows: [{ kind: 'plain' as const, id: '2', primary: 'Other' }],
    },
  ]
  expect(
    filterRows(groups, new Map(), 'open', new Set()).map((g) => g.title),
  ).toEqual(['A'])
})

it('returns everything for a blank query', () => {
  const groups = [{ rows: [row('a'), row('b')] }]
  expect(filterRows(groups, checks, '   ', new Set())).toEqual(groups)
})

it('matches free text the same way', () => {
  expect(matchesText('{ "Bow": 1 }', '  bow ')).toBe(true)
  expect(matchesText('{ "Bow": 1 }', 'hammer')).toBe(false)
  expect(matchesText('anything', '')).toBe(true)
})

it('needs every word, in any order and across fields', () => {
  const groups = [{ rows: [row('a'), row('b')] }]
  expect(ids(filterRows(groups, checks, 'chest kf', new Set()))).toEqual(['b'])
  expect(ids(filterRows(groups, checks, 'kf nuts', new Set()))).toEqual(['b'])
  expect(ids(filterRows(groups, checks, 'kf bow', new Set()))).toEqual([])
})

it('ignores apostrophes on both sides', () => {
  expect(matchesText("Dodongo's Cavern", 'dodongos')).toBe(true)
  expect(matchesText('Dodongos Cavern', "dodongo's")).toBe(true)
  expect(matchesText('Dodongos Cavern', 'dodongo’s')).toBe(true)
})

it.each([
  ['gerudo valley', 'GV Chest'],
  ['kokiri forest', 'KF Mido Top Right Chest'],
  ["dodongo's", 'Dodongos Cavern Map Chest'],
  ['zeldas lullaby', 'Sheik at Colossus'],
  ['kf chest', 'KF Mido Top Right Chest'],
  ['mido chest', 'KF Mido Top Right Chest'],
])('finds "%s" in a real log', (query, name) => {
  const { seed } = open('normal.json')
  const byId = new Map(seed.checks.map((c) => [c.id, c]))
  const found = filterRows(
    rowsOf(sectionById(seed, 'checks')),
    byId,
    query,
    new Set(),
  )
  expect(found.flatMap((g) => g.rows.map((r) => r.primary))).toContain(name)
})

it('matches a concealed row only once it is ticked', () => {
  const hint: Row = {
    kind: 'concealed',
    id: 'static|Ganondorf Hint',
    primary: 'Ganondorf Hint',
    secondary: 'Look in the Forest',
  }
  const groups = [{ rows: [hint] }]
  expect(ids(filterRows(groups, new Map(), 'forest', new Set()))).toEqual([])
  expect(ids(filterRows(groups, new Map(), 'ganondorf', new Set()))).toEqual([])
  const ticked = new Set([hint.id])
  expect(ids(filterRows(groups, new Map(), 'forest', ticked))).toEqual([
    hint.id,
  ])
})

it('matches a row on its extra search words', () => {
  const groups: RowGroup[] = [
    {
      rows: [
        {
          kind: 'plain',
          id: 'a',
          primary: 'Door',
          searchText: 'Hyrule Market',
        },
      ],
    },
  ]
  expect(filterRows(groups, new Map(), 'market', new Set())).toHaveLength(1)
})
