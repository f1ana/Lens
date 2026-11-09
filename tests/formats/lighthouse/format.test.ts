import { openLogText } from '@/formats'
import { twoShipFormat } from '@/formats/2ship'
import { lighthouseFormat } from '@/formats/lighthouse'
import { shipFormat } from '@/formats/ship'

import { fixture, sectionById, seedOf } from '../../helpers'

const ALL = 'lighthouse-1.2.2-all-shuffles.json'
const NO_LOGIC = 'lighthouse-1.2.2-no-logic.json'

async function openLog(log: Record<string, unknown>) {
  return seedOf(await openLogText(JSON.stringify(log)))
}

it('opens a Lighthouse log, saying it records no version', async () => {
  const seed = await openLog(fixture(ALL))
  expect(seed.title).toBe('1104971053')
  expect(seed.subtitle).toBe('Read as 1.2.2')
  expect(seed.provenance).toEqual({
    port: 'Lighthouse',
    theme: 'lighthouse',
    build: { kind: 'unrecorded' },
  })
  expect(seed.facts).toEqual([])
  expect(seed.details).toEqual([])
  expect(seed.sections.map((s) => s.id)).toEqual([
    'checks',
    'settings',
    'starting-inventory',
  ])
})

it('tells Lighthouse logs from the other games', () => {
  for (const name of [ALL, NO_LOGIC]) {
    expect(lighthouseFormat.recognizes(fixture(name))).toBe(true)
    expect(shipFormat.recognizes(fixture(name))).toBe(false)
    expect(twoShipFormat.recognizes(fixture(name))).toBe(false)
  }
  const untyped = { ...fixture(ALL), type: 42 }
  expect(lighthouseFormat.recognizes(untyped)).toBe(true)
  expect(shipFormat.recognizes(untyped)).toBe(false)
  expect(twoShipFormat.recognizes(untyped)).toBe(false)
  for (const name of ['normal.json', '2ship-5.0.1-all-shuffles.json'])
    expect(lighthouseFormat.recognizes(fixture(name))).toBe(false)
})

it('keys saved ticks to the checks, so a regenerated seed starts fresh', async () => {
  const log = fixture(ALL)
  const other = { ...log, checks: { RC_BGS_JIGGY_CROCTUS: [3, 2, 0, 0] } }
  expect((await openLog(log)).key).not.toBe((await openLog(other)).key)
})

it.each([
  ['abc', 'abc'],
  ['', 'Unnamed seed'],
  [undefined, 'Unnamed seed'],
])('titles a seed of %j as %s', async (seedValue, title) => {
  const seed = await openLog({ ...fixture(ALL), seed: seedValue })
  expect(seed.title).toBe(title)
})

it('fails only the inventory when the loadout is damaged', async () => {
  const seed = await openLog({ ...fixture(ALL), loadout: { abilities: 42 } })
  expect(sectionById(seed, 'starting-inventory').content.kind).toBe('failed')
  expect(sectionById(seed, 'checks').content.kind).toBe('rows')
  expect(sectionById(seed, 'settings').content.kind).toBe('rows')
})

it('shows keys it does not read under Other data', async () => {
  const seed = await openLog({ ...fixture(ALL), extra: true })
  expect(sectionById(seed, 'other-data').content).toEqual({
    kind: 'text',
    text: JSON.stringify({ extra: true }, null, 2),
  })
})
