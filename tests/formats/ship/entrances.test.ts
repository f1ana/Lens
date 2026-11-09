import type { SectionBody } from '@/formats/shared/sections'
import { PARTIAL_MESSAGE } from '@/formats/shared/sections'
import { entrancesSection } from '@/formats/ship/entrances'
import { isRecord } from '@/lib/is-record'

import { fixture, rowsOf } from '../../helpers'
import { lookups, SHIP_DATA } from './data-9.3.1'

const ENTRANCES: Record<
  string,
  undefined | { destination: string; group: string; source: string }
> = SHIP_DATA.entrances

function entrance(index: string) {
  const found = ENTRANCES[index]
  if (!found) throw new Error(`No entrance ${index}`)
  return found
}

function links(section: null | SectionBody) {
  if (section?.content.kind !== 'links') throw new Error('No links')
  return section.content
}

function allLinks(content: ReturnType<typeof links>) {
  return content.groupings[0].groups
    .flatMap((group) => group.rows)
    .flatMap((row) => (row.kind === 'link' ? [row.link] : []))
}

function placeNamed(content: ReturnType<typeof links>, name: string) {
  const found = Object.values(content.places).find((p) => p.name === name)
  if (!found) throw new Error(`No place ${name}`)
  return found
}

function allRows(section: null | SectionBody) {
  if (!section) throw new Error('No section')
  return rowsOf(section).flatMap((group) => group.rows)
}

it('is hidden on seeds without entrance data', () => {
  expect(entrancesSection({}, lookups)).toBeNull()
})

it('lists every named entrance from a real log', () => {
  const log = fixture('entrances-9.3.0.json')
  const section = entrancesSection(log, lookups)
  const pairs = allRows(section).map(
    (r) => `${r.primary} → ${r.secondary ?? ''}`,
  )
  expect(isRecord(log.entrancesMap)).toBe(true)
  for (const sphere of Object.values(log.entrancesMap as object)) {
    for (const [source, destination] of Object.entries(
      sphere as Record<string, string>,
    )) {
      expect(pairs).toContain(`${source} → ${destination}`)
    }
  }
})

it('names a reverse entrance missing from the map', () => {
  const section = entrancesSection(
    {
      entrancesMap: {},
      entrances: [{ index: 0, override: 4 }],
    },
    lookups,
  )
  expect(allRows(section)[0]!.primary).toBe(entrance('0').source)
  expect(allRows(section)[0]!.secondary).toBe(entrance('4').destination)
})

it('shows an unknown index as a number instead of dropping it', () => {
  const section = entrancesSection(
    {
      entrancesMap: {},
      entrances: [{ index: 9999, override: 4 }],
    },
    lookups,
  )
  expect(allRows(section)[0]!.primary).toBe('Entrance 9999')
})

it('does not repeat an entrance found in both sources', () => {
  const name = entrance('0').source
  const destination = entrance('4').destination
  const section = entrancesSection(
    {
      entrancesMap: { 'sphere 00': { [name]: destination } },
      entrances: [{ index: 0, override: 4 }],
    },
    lookups,
  )
  expect(allRows(section)).toHaveLength(1)
})

it('groups by the source group, with Other for unknown entries', () => {
  const section = entrancesSection(
    {
      entrancesMap: {},
      entrances: [
        { index: 0, override: 4 },
        { index: 9999, override: 4 },
      ],
    },
    lookups,
  )
  const titles = rowsOf(section!).map((g) => g.title)
  expect(titles).toEqual([entrance('0').group, 'Other'].sort())
  expect(section?.count).toBe(2)
})

it('tolerates records of the wrong shape', () => {
  expect(() =>
    entrancesSection({ entrances: [null, 7, { index: 'x' }] }, lookups),
  ).not.toThrow()
  expect(() =>
    entrancesSection(
      {
        entrances: [{ index: 'constructor', override: '__proto__' }],
      },
      lookups,
    ),
  ).not.toThrow()
})

it('hides Entrances when the log lists none', () => {
  expect(
    entrancesSection({ entrancesMap: {}, entrances: [] }, lookups),
  ).toBeNull()
})

it('fails the section when no entrances can be read', () => {
  expect(() => entrancesSection({ entrances: 42 }, lookups)).toThrow()
  expect(() => entrancesSection({ entrancesMap: 42 }, lookups)).toThrow()
})

it('keeps the entrances it can read and says the rest are missing', () => {
  const section = entrancesSection(
    {
      entrancesMap: 42,
      entrances: [{ index: 0, override: 4 }],
    },
    lookups,
  )
  expect(allRows(section)).toHaveLength(1)
  expect(section?.note).toBe(PARTIAL_MESSAGE)
})

it('does not read inherited properties as entrances', () => {
  const section = entrancesSection(
    {
      entrances: [{ index: 0, override: 'constructor' }],
    },
    lookups,
  )
  expect(section).toBeNull()
})

it('walks a real log from Lost Woods South Exit', () => {
  const content = links(
    entrancesSection(fixture('entrances-9.3.1.json'), lookups),
  )
  const start = allLinks(content).find(
    (l) => l.door === 'Lost Woods South Exit',
  )!
  expect(start.landing).toMatchObject({
    place: 'Hyrule Market',
    detail: 'Outside the Mask Shop',
  })
  const market = content.places[start.landing.placeId!]!
  expect(market.doors).toHaveLength(11)
  const names = market.doors.map((d) => d.door)
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
  const shop = market.doors.find((d) => d.door === 'MK Mask Shop Entry')!
  expect(shop.landing.place).toBe('Water Temple')
})

it('only lists doors the log names', () => {
  const content = links(
    entrancesSection(
      {
        entrancesMap: {
          'sphere 00': { 'Kak Bazaar Entry': 'Market South Exit' },
        },
      },
      lookups,
    ),
  )
  const doors = placeNamed(content, 'Kakariko Village').doors
  expect(doors.map((d) => d.door)).toEqual(['Kak Bazaar Entry'])
  expect(placeNamed(content, 'Hyrule Market').doors).toEqual([])
})

it('walks the reverse direction a coupled log only numbers', () => {
  const content = links(
    entrancesSection(
      {
        entrancesMap: {
          'sphere 00': { [entrance('0').source]: entrance('4').destination },
        },
        entrances: [
          { index: 0, override: 4 },
          { index: 4, override: 0 },
        ],
      },
      lookups,
    ),
  )
  const reverse = entrance('4').source
  const from = allLinks(content).find((l) => l.door === reverse)
  expect(from?.fromPlaceId).toBeDefined()
  const { doors } = content.places[from!.fromPlaceId!]!
  expect(doors.map((d) => d.door)).toContain(reverse)
})

it('keeps the first destination for a door named twice', () => {
  const content = links(
    entrancesSection(
      {
        entrancesMap: {
          'sphere 00': { 'Market South Exit': 'Water Temple Entrance' },
          'sphere 01': { 'Market South Exit': 'HF Tektite Grotto' },
        },
      },
      lookups,
    ),
  )
  const { doors } = placeNamed(content, 'Hyrule Market')
  expect(doors).toHaveLength(1)
  expect(doors[0]!.landing.place).toBe('Water Temple')
})

it('keeps a door it cannot place', () => {
  const content = links(
    entrancesSection(
      {
        entrancesMap: { 'sphere 00': { Somewhere: 'Elsewhere' } },
      },
      lookups,
    ),
  )
  const [link] = allLinks(content)
  expect(link).toMatchObject({
    door: 'Somewhere',
    landing: { place: 'Elsewhere' },
  })
  expect(link!.fromPlaceId).toBeUndefined()
})

it('keeps raw names and plain words searchable', () => {
  const rows = allRows(
    entrancesSection(fixture('entrances-9.3.1.json'), lookups),
  )
  const row = rows.find((r) => r.primary === 'Lost Woods South Exit')!
  expect(row.secondary).toBe('MK Mask Shop Entry')
  expect(row.searchText).toContain('Hyrule Market')
  expect(row.searchText).toContain('Outside the Mask Shop')
})
