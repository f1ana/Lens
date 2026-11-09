import { Buckets } from '@/formats/shared/buckets'
import { shipFormat } from '@/formats/ship'
import { OTHER_AREA } from '@/formats/ship/areas'
import { OTHER_TYPE } from '@/formats/ship/check-types'
import { readChecks, spheresSection } from '@/formats/ship/checks'

import {
  fixture,
  open,
  rowCount,
  rowNames,
  rowsOf,
  sectionById,
  seedOf,
} from '../../helpers'
import { lookups } from './data-9.3.1'

it('reads plain, priced and ice trap checks', () => {
  const [plain, shop, trap] = readChecks(
    {
      locations: {
        'KF Chest': 'Bow',
        'KF Shop Item 5': { item: 'Recovery Heart', price: 75 },
        'GC Chest': {
          item: 'Ice Trap',
          model: 'Progressive Bow',
          trickName: 'Fairy Bow',
          trickArticle: 'a ',
        },
      },
    },
    lookups,
  )
  expect(plain).toMatchObject({ item: 'Bow' })
  expect(shop).toMatchObject({ item: 'Recovery Heart', price: '75 rupees' })
  expect(trap).toMatchObject({ item: 'Ice Trap', disguise: 'Fairy Bow' })
  expect(trap!.searchText).toContain('fairy bow')
})

it('keeps a check whose value is unreadable', () => {
  expect(
    readChecks({ locations: { 'KF Chest': 42 } }, lookups)[0],
  ).toMatchObject({
    name: 'KF Chest',
    item: 'Unknown item',
  })
})

it('handles check names that collide with object prototypes', () => {
  const log = JSON.parse(
    '{"locations":{"constructor":"Bow","__proto__":"Bomb"}}',
  ) as Record<string, unknown>
  expect(readChecks(log, lookups).map((c) => c.item)).toEqual(['Bow', 'Bomb'])
  expect(lookups.areaOf('constructor')).toBe(OTHER_AREA)
})

it('groups checks by area, with unknown names in Other', () => {
  expect(lookups.areaOf('KF Kokiri Sword Chest')).toBe('Kokiri Forest')
  expect(lookups.areaOf("Ganon's Castle Spirit Trial Invisible Chest")).toBe(
    "Ganon's Castle",
  )
  expect(lookups.areaOf('Bongo Bongo')).toBe('Shadow Temple')
  expect(lookups.areaOf('Sheik at Colossus')).toBe('Desert Colossus')
  expect(lookups.areaOf('OGC Great Fairy Reward')).toBe('Hyrule Castle')
  expect(lookups.areaOf("Ganon's Soul")).toBe("Ganon's Castle")
  expect(lookups.areaOf('Brand New Check')).toBe(OTHER_AREA)
})

it('adds sphere tags to playthrough checks', () => {
  const { seed } = open('normal.json')
  const arrows = seed.checks.find(
    (c) => c.name === 'Shadow Temple Invisible Blades Visible Chest',
  )
  expect(arrows?.tags).toContain('Sphere 11')
})

it('points sphere rows at checks so their items stay hidden', () => {
  const { seed } = open('normal.json')
  const section = sectionById(seed, 'spheres')
  expect(section.content).toMatchObject({ kind: 'rows' })
  const rows = rowsOf(section).flatMap((g) => g.rows)
  expect(
    rows.every(
      (r) => r.kind === 'concealed-check' && r.secondary === undefined,
    ),
  ).toBe(true)
})

it('counts spheres, not the checks inside them', () => {
  expect(sectionById(open('normal.json').seed, 'spheres').count).toBe(13)
})

it('does not count a sphere with no checks', () => {
  const section = spheresSection({
    playthrough: { 'sphere 00': { 'KF Chest': 'Bow' }, 'sphere 01': {} },
  })
  expect(section?.count).toBe(1)
})

it('disguises an ice trap whatever language its item name is in', () => {
  const [trap] = readChecks(
    {
      locations: {
        'GC Chest': { item: 'Eisfalle', trickName: 'Feenbogen' },
      },
    },
    lookups,
  )
  expect(trap).toMatchObject({ item: 'Eisfalle', disguise: 'Feenbogen' })
  expect(trap!.searchText).toContain('feenbogen')
})

it('keeps sphere rows hidden when locations is missing', async () => {
  const rest = Object.fromEntries(
    Object.entries(fixture('normal.json')).filter(
      ([key]) => key !== 'locations',
    ),
  )
  const result = await shipFormat.read(rest)
  const seed = seedOf(result)
  const rows = rowsOf(sectionById(seed, 'spheres')).flatMap((g) => g.rows)
  expect(rows.length).toBeGreaterThan(0)
  expect(rows.some((r) => r.secondary !== undefined)).toBe(false)
  const ids = new Set(seed.checks.map((c) => c.id))
  expect(rows.every((r) => 'checkId' in r && ids.has(r.checkId))).toBe(true)
  expect(seed.checks.some((c) => c.tags.includes('Sphere 11'))).toBe(true)
})

it('keeps the Checks section failed but spheres hidden when locations is unreadable', async () => {
  const result = await shipFormat.read({
    ...fixture('normal.json'),
    locations: 7,
  })
  const seed = seedOf(result)
  expect(sectionById(seed, 'checks').content.kind).toBe('failed')
  const rows = rowsOf(sectionById(seed, 'spheres')).flatMap((g) => g.rows)
  expect(
    rows.every(
      (r) => r.kind === 'concealed-check' && r.secondary === undefined,
    ),
  ).toBe(true)
  expect(seed.checks.length).toBe(rows.length)
})

it('adds a playthrough check that locations lacks to the checks', async () => {
  const normal = fixture('normal.json')
  const name = 'Shadow Temple Invisible Blades Visible Chest'
  const locations = Object.fromEntries(
    Object.entries(normal.locations as Record<string, unknown>).filter(
      ([key]) => key !== name,
    ),
  )
  const seed = seedOf(await shipFormat.read({ ...normal, locations }))
  const check = seed.checks.find((c) => c.name === name)
  expect(check).toBeDefined()
  expect(check!.tags).toContain('Sphere 11')
  expect(check!.item).not.toBe('Unknown item')
  const groups = rowsOf(sectionById(seed, 'checks'))
  const row = groups
    .flatMap((g) => g.rows)
    .find((r) => 'checkId' in r && r.checkId === name)
  expect(row).toBeDefined()
  expect(groups.find((g) => g.rows.includes(row!))?.title).toBe('Shadow Temple')
  expect(sectionById(seed, 'checks').count).toBe(seed.checks.length)
})

it('counts every check in the groups, with Other last', () => {
  const { seed } = open('normal.json')
  const section = sectionById(seed, 'checks')
  expect(rowCount(section)).toBe(seed.checks.length)
  const titles = rowsOf(section).map((g) => g.title)
  if (titles.includes(OTHER_AREA)) expect(titles.at(-1)).toBe(OTHER_AREA)
})

it('lists checks in an area missing from the area order', () => {
  const buckets = new Buckets()
  for (const area of ['Zeta Land', OTHER_AREA, 'Alpha Land', 'Kokiri Forest'])
    buckets.add(area, { kind: 'plain', id: area, primary: area })
  expect(
    buckets.groups(lookups.areaOrder, OTHER_AREA).map((g) => g.title),
  ).toEqual(['Kokiri Forest', 'Alpha Land', 'Zeta Land', OTHER_AREA])
})

it.each([
  ['Deku Tree Map Chest', 'Chests'],
  ['KF Links House Cow', 'Cows'],
  ['KF Shop Item 1', 'Shops'],
  ['Song from Impa', 'Songs'],
  ['Queen Gohma', 'Boss Rewards'],
  ['Market 10 Big Poes', 'Gifts and Rewards'],
])('names the kind of check %s is', (name, type) => {
  expect(lookups.checkTypeOf(name)).toBe(type)
})

it('puts a check it does not know under Other', () => {
  expect(lookups.checkTypeOf('Brand New Check')).toBe(OTHER_TYPE)
  expect(lookups.checkTypeOf('constructor')).toBe(OTHER_TYPE)
})

it.each(['normal.json', 'hardcoded-no-logic.json', 'entrances-9.3.0.json'])(
  'knows the type of every check in %s',
  (name) => {
    const unknown = open(name)
      .seed.checks.map((check) => check.name)
      .filter((check) => lookups.checkTypeOf(check) === OTHER_TYPE)
    expect(unknown).toEqual([])
  },
)

describe('songs section', () => {
  const { seed } = open('normal.json')
  const section = sectionById(seed, 'songs')
  const songs = seed.checks.filter((c) =>
    /Song|Lullaby|Minuet|Bolero|Serenade|Requiem|Nocturne|Prelude/.test(c.item),
  )

  it('lists the checks whose item is a song, wherever they are', () => {
    expect(songs.length).toBeGreaterThan(0)
    expect(rowNames(section).sort()).toEqual(songs.map((c) => c.name).sort())
  })

  it('counts them, with no area headings', () => {
    expect(section.count).toBe(songs.length)
    expect(rowsOf(section)[0]?.title).toBeUndefined()
  })

  it('follows the item, not the song location', async () => {
    const moved = seedOf(
      await shipFormat.read({
        locations: { 'Song from Impa': 'Bow', 'KF Chest': "Zelda's Lullaby" },
      }),
    )
    expect(rowNames(sectionById(moved, 'songs'))).toEqual(['KF Chest'])
  })

  it('is left out when no check holds a song', async () => {
    const bare = seedOf(
      await shipFormat.read({ locations: { 'KF Chest': 'Bow' } }),
    )
    expect(bare.sections.map((s) => s.id)).not.toContain('songs')
  })
})
