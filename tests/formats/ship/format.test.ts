import { versionRange } from '@/formats/shared/version'
import { shipFormat } from '@/formats/ship'

import { fixture, open, sectionById, seedOf } from '../../helpers'

const log = fixture('normal.json')

it('opens a 9.3.1 log with the expected header', () => {
  const { seed } = open('normal.json')
  expect(seed.title).toBe('GetYourHalloweenCostume')
  expect(seed.subtitle).toBe('Dewey Bravo (9.3.1)')
  expect(seed.facts).toContainEqual({ label: 'Hash', value: '04-41-48-24-78' })
  expect(seed.facts).toContainEqual({ label: 'Starting age', value: 'Child' })
  expect(seed.checks).toHaveLength(479)
})

it('recognizes a log with any one known key removed', () => {
  for (const key of ['version', 'locations', 'settings', 'playthrough']) {
    const rest = Object.fromEntries(
      Object.entries(log).filter(([k]) => k !== key),
    )
    expect(shipFormat.recognizes(rest)).toBe(true)
  }
})

it('does not treat a generic object as a log', () => {
  expect(shipFormat.recognizes({ version: '1.0.0' })).toBe(false)
})

it('does not treat generic keys alone as a log', () => {
  const config = { version: 2, seed: 'abc', settings: { theme: 'dark' } }
  expect(shipFormat.recognizes(config)).toBe(false)
})

it('leaves 2Ship logs for another format', () => {
  const twoShip = {
    type: '2S2H_RANDO_SPOILER',
    commitHash: 'abc1234',
    finalSeed: 7,
    options: {},
    checks: {},
  }
  expect(shipFormat.recognizes(twoShip)).toBe(false)
})

it('shows the section order from the spec, hiding empty sections', async () => {
  const { seed } = open('normal.json')
  const ids = seed.sections.map((s) => s.id)
  const order = [
    'checks',
    'songs',
    'hints',
    'spheres',
    'settings',
    'starting-inventory',
    'excluded-locations',
    'tricks',
    'required-trials',
    'master-quest-dungeons',
    'other-data',
  ]
  expect(ids).toEqual(order.filter((id) => ids.includes(id)))
  expect(ids.slice(0, 4)).toEqual(['checks', 'songs', 'hints', 'spheres'])

  const bare = seedOf(
    await shipFormat.read({ locations: { 'KF Chest': 'Bow' } }),
  )
  expect(bare.sections.map((s) => s.id)).toEqual(['checks'])
})

it('names the hash icons', () => {
  const { seed } = open('normal.json')
  const icons = seed.facts.find((f) => f.label === 'Hash icons')
  expect(icons?.value.split(', ')).toHaveLength(5)
  expect(seed.key).toBe(
    'Dewey Bravo (9.3.1)|GetYourHalloweenCostume|04-41-48-24-78',
  )
})

it('falls back when header fields are missing', async () => {
  const result = await shipFormat.read({ locations: {}, settings: {} })
  expect(result).toMatchObject({
    status: 'opened',
    seed: { title: 'Unnamed seed', subtitle: 'Unknown version', facts: [] },
  })
})

it('leaves the Spheres section out of a No Logic log', () => {
  const { seed } = open('hardcoded-no-logic.json')
  expect(seed.sections.map((s) => s.id)).not.toContain('spheres')
  expect(seed.sections.map((s) => s.id)).toContain('checks')
})

it('keeps the Spheres section of a log with logic on', async () => {
  const settings = { ...(log.settings as object), 'No Logic': 'Off' }
  const result = await shipFormat.read({ ...log, settings })
  expect(sectionById(result, 'spheres').count).toBe(13)
})

it('still reports a damaged playthrough in a No Logic log', async () => {
  const noLogic = fixture('hardcoded-no-logic.json')
  const result = await shipFormat.read({ ...noLogic, playthrough: 7 })
  expect(sectionById(result, 'spheres').content.kind).toBe('failed')
})

it('opens the 9.3.0 entrance log with its entrances', () => {
  const { seed } = open('entrances-9.3.0.json')
  expect(seed.subtitle).toBe('Dewey Alfa (9.3.0)')
  expect(sectionById(seed, 'entrances').count).toBeGreaterThan(0)
})

it('reports the supported range as floor to newest known release', () => {
  expect(
    versionRange(
      [9, 3, 0],
      [
        [9, 3, 0],
        [9, 3, 1],
      ],
    ),
  ).toBe('9.3.0–9.3.1')
  expect(
    versionRange(
      [9, 3, 0],
      [
        [9, 3, 1],
        [9, 3, 0],
      ],
    ),
  ).toBe('9.3.0–9.3.1')
})

it('reports the floor alone when no release is known', () => {
  expect(versionRange([9, 3, 0], [])).toBe('9.3.0')
})
