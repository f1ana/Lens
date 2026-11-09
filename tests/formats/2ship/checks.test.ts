import { readTwoShip } from '@/formats/2ship'
import { checksSection, readChecks } from '@/formats/2ship/checks'
import { hasRows } from '@/model/seed'

import { fixture, open, rowsOf, sectionById, seedOf } from '../../helpers'
import { lookups } from './data-5.0.1'

const ALL = '2ship-5.0.1-all-shuffles.json'

it('shows a readable check and item', () => {
  const { seed } = open('2ship-5.0.1-no-logic-plentiful.json')
  expect(
    seed.checks.find((c) => c.id === 'RC_BOMB_SHOP_ITEM_01'),
  ).toMatchObject({
    name: 'Bomb Shop Item 01',
    price: '138 rupees',
  })
})

it.each([
  [0, '0 rupees'],
  [1, '1 rupee'],
  [2, '2 rupees'],
])('words a price of %i', (price, text) => {
  const log = {
    checks: { RC_BOMB_SHOP_ITEM_01: { price, randoItemId: 'RI_JUNK' } },
  }
  expect(readChecks(log, lookups)[0]?.price).toBe(text)
})

it('keeps every check in the log', () => {
  expect(open(ALL).seed.checks).toHaveLength(2639)
  expect(open('2ship-5.0.1-vanilla.json').seed.checks).toHaveLength(2641)
})

it('falls back for codes Lens does not know', () => {
  const [check] = readChecks(
    { checks: { RC_BRAND_NEW_CHECK: 'RI_BRAND_NEW' } },
    lookups,
  )
  expect(check).toMatchObject({ name: 'Brand New Check', item: 'Brand New' })
})

it('treats a check named like an object property as unknown', () => {
  expect(
    readChecks({ checks: { constructor: 'toString' } }, lookups)[0],
  ).toMatchObject({
    name: 'Constructor',
    item: 'Tostring',
  })
})

it('names an item the log gives no code for', () => {
  expect(
    readChecks({ checks: { RC_BOMB_SHOP_ITEM_01: 7 } }, lookups)[0]?.item,
  ).toBe('Unknown item')
})

it('searches by area, name and item', () => {
  const { seed } = open(ALL)
  expect(
    seed.checks.find((c) => c.id === 'RC_KEATON_QUIZ')?.searchText,
  ).toContain('milk road')
})

it('lists a shared check under each of its areas', () => {
  // The first grouping is by area.
  const groups = rowsOf(sectionById(open(ALL).seed, 'checks'))
  const titles = groups
    .filter((g) => g.rows.some((r) => r.primary === 'Keaton Quiz'))
    .map((g) => g.title)
  expect(titles).toEqual(
    expect.arrayContaining([
      'North Clock Town',
      'Milk Road',
      'Mountain Village',
    ]),
  )
})

it('gives each area row of a shared check its own id', () => {
  const rows = rowsOf(sectionById(open(ALL).seed, 'checks')).flatMap((g) =>
    g.rows.filter((r) => r.primary === 'Keaton Quiz'),
  )
  expect(rows.map((r) => r.id)).toEqual(
    expect.arrayContaining(['Milk Road|RC_KEATON_QUIZ']),
  )
  expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length)
  expect(
    rows.every((r) => 'checkId' in r && r.checkId === 'RC_KEATON_QUIZ'),
  ).toBe(true)
})

it('puts a check Lens has no data for under Other', () => {
  const log = { checks: { RC_BRAND_NEW_CHECK: 'RI_JUNK' } }
  const { content } = checksSection(log, readChecks(log, lookups), lookups)
  expect(
    hasRows(content) && content.groupings.map((g) => g.groups[0]?.title),
  ).toEqual(['Other', 'Other'])
})

it('offers no sphere grouping and groups by area, type and hint', () => {
  const log = fixture(ALL)
  const checks = readChecks(log, lookups)
  checks[0]?.hints.push({
    source: 'Hookshot',
    text: 'Treasure in Romani Ranch',
  })
  const { content } = checksSection(log, checks, lookups)
  expect(hasRows(content) && content.groupings.map((g) => g.id)).toEqual([
    'area',
    'type',
    'hinted',
  ])
})

it('leaves out the Hinted grouping when no check is hinted', () => {
  const log = { checks: { RC_BOMB_SHOP_ITEM_01: 'RI_JUNK' } }
  const { content } = checksSection(log, readChecks(log, lookups), lookups)
  expect(hasRows(content) && content.groupings.map((g) => g.id)).toEqual([
    'area',
    'type',
  ])
})

it('notes that junk is chosen during play, only when the log has junk', () => {
  expect(sectionById(open(ALL).seed, 'checks').note).toBe(
    'Junk stays unnamed because the game picks it during play.',
  )
  const log = { checks: { RC_BOMB_SHOP_ITEM_01: 'RI_ARROWS_10' } }
  expect(
    checksSection(log, readChecks(log, lookups), lookups).note,
  ).toBeUndefined()
})

it('throws when checks is not an object', () => {
  expect(() => checksSection({ checks: [] }, [], lookups)).toThrow(
    'checks is not an object',
  )
})

describe('songs section', () => {
  const { seed } = open(ALL)
  const section = sectionById(seed, 'songs')
  const ids = rowsOf(section).flatMap((g) => g.rows.map((r) => r.id))

  it('lists the checks whose item is a song, wherever they are', () => {
    expect(ids).toContain('RC_TERMINA_FIELD_COW_GROTTO_GRASS_61')
    expect(ids).toContain('RC_PATH_TO_SNOWHEAD_GROTTO_GRASS_02')
    expect(ids).toHaveLength(14)
    expect(section.count).toBe(14)
  })

  it('leaves out a song location that holds something else', () => {
    expect(ids).not.toContain('RC_STARTING_ITEM_SONG_OF_HEALING')
  })

  it('is left out when no check holds a song', () => {
    const log = { checks: { RC_BOMB_SHOP_ITEM_01: 'RI_JUNK' } }
    const bare = seedOf(readTwoShip(log, lookups))
    expect(bare.sections.map((s) => s.id)).not.toContain('songs')
  })
})
