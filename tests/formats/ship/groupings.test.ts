import { checksSection } from '@/formats/ship/checks'
import type { Check, Grouping, Section } from '@/model/seed'
import { hasRows } from '@/model/seed'

import { checkNamed, open, rowsOf, sectionById } from '../../helpers'
import { lookups } from './data-9.3.1'

type Readable = Pick<Section, 'content'>

function groupingsOf(section: Readable): Grouping[] {
  if (!hasRows(section.content)) throw new Error('The section has no rows')
  return section.content.groupings
}

function find(section: Readable, id: string): Grouping {
  const found = groupingsOf(section).find((g) => g.id === id)
  if (!found) throw new Error(`No grouping "${id}"`)
  return found
}

function rowIds(grouping: Grouping): string[] {
  return grouping.groups.flatMap((g) => g.rows.map((r) => r.id)).sort()
}

const { seed } = open('normal.json')

describe.each([
  ['checks', ['area', 'type', 'sphere', 'hinted']],
  ['spheres', ['sphere']],
  ['hints', ['type']],
])('%s groupings', (id, ids) => {
  const section = sectionById(seed, id)

  it('offers each arrangement, starting with the default', () => {
    expect(groupingsOf(section).map((g) => g.id)).toEqual(ids)
  })

  it('shows every row once in every arrangement', () => {
    const [first, ...rest] = groupingsOf(section)
    const expected = rowIds(first!)
    expect(expected.length).toBeGreaterThan(0)
    expect(new Set(expected).size).toBe(expected.length)
    for (const other of rest) expect(rowIds(other)).toEqual(expected)
  })

  it('has no empty or untitled groups', () => {
    for (const g of groupingsOf(section))
      for (const group of g.groups) {
        expect(group.title).toBeTruthy()
        expect(group.rows.length).toBeGreaterThan(0)
      }
  })
})

it('groups checks by the sphere that holds them', () => {
  const groups = find(sectionById(seed, 'checks'), 'sphere').groups
  const check = checkNamed(seed, 'Shadow Temple Invisible Blades Visible Chest')
  const holder = groups.find((g) => g.rows.some((r) => r.id === check.id))
  expect(holder?.title).toBe(check.tags[0])
  expect(groups.at(-1)?.title).toBe('Not in the playthrough')
})

it('puts spheres in numeric order, not text order', () => {
  const titles = find(sectionById(seed, 'checks'), 'sphere').groups.map(
    (g) => g.title,
  )
  const numbers = titles.flatMap((t) =>
    t?.startsWith('Sphere ') ? [Number(t.slice(7))] : [],
  )
  expect(numbers).toEqual([...numbers].sort((a, b) => a - b))
})

it('groups checks by type, with Other last', () => {
  const checks: Check[] = [
    'KF Links House Cow',
    'Mystery',
    'Deku Tree Map Chest',
  ].map((name) => ({
    id: name,
    name,
    item: 'Bow',
    tags: [],
    hints: [],
    searchText: name,
  }))
  const groups = find(checksSection({}, checks, lookups), 'type').groups
  expect(groups.map((g) => [g.title, g.rows.map((r) => r.id)])).toEqual([
    ['Chests', ['Deku Tree Map Chest']],
    ['Cows', ['KF Links House Cow']],
    ['Other', ['Mystery']],
  ])
})

it('leaves the sphere grouping out of a No Logic log', () => {
  const noLogic = open('hardcoded-no-logic.json').seed
  expect(groupingsOf(sectionById(noLogic, 'checks')).map((g) => g.id)).toEqual([
    'area',
    'type',
    'hinted',
  ])
})

it('separates hinted checks from the rest', () => {
  const groups = find(sectionById(seed, 'checks'), 'hinted').groups
  const hinted = new Set(
    seed.checks.filter((c) => c.hints.length > 0).map((c) => c.id),
  )
  expect(hinted.size).toBeGreaterThan(0)
  for (const group of groups)
    for (const row of group.rows)
      expect(hinted.has(row.id)).toBe(group.title === 'Hinted')
})

it('keeps sphere rows concealed, with no area to give them away', () => {
  const section = sectionById(seed, 'spheres')
  expect(groupingsOf(section).map((g) => g.id)).toEqual(['sphere'])
  const rows = rowsOf(section).flatMap((g) => g.rows)
  expect(rows.length).toBeGreaterThan(0)
  expect(rows.every((row) => row.kind === 'concealed-check')).toBe(true)
})

it('groups entrances by region and by type', () => {
  const { seed: entranceSeed } = open('entrances-9.3.0.json')
  const section = sectionById(entranceSeed, 'entrances')
  expect(groupingsOf(section).map((g) => g.id)).toEqual(['region', 'type'])
  const types = find(section, 'type').groups.map((g) => g.title)
  expect(types).toEqual(expect.arrayContaining(['Overworld']))
  expect(rowIds(find(section, 'type'))).toEqual(rowIds(find(section, 'region')))
})

it('keeps single-arrangement sections free of the dropdown', () => {
  for (const id of ['settings', 'tricks'])
    if (seed.sections.some((s) => s.id === id)) {
      expect(groupingsOf(sectionById(seed, id))).toHaveLength(1)
    }
})
