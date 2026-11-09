import { fireEvent, render, within } from '@testing-library/react'

import { SeedView } from '@/app/seed/SeedView'
import { openLogText } from '@/formats'
import { readHints } from '@/formats/2ship/hints'
import type { Seed } from '@/model/seed'

import { lookups } from '../formats/2ship/data-5.0.1'
import { fixture, sectionById, seedOf } from '../helpers'

const normal = fixture('normal.json')
const withEntrances = fixture('entrances-9.3.0.json')
const twoShip = fixture('2ship-5.0.1-all-shuffles.json')
const lighthouse = fixture('lighthouse-1.2.2-all-shuffles.json')

// Every entrance row is a button, and these tests click each one
const FEW_ENTRANCES = 10
const { 'sphere 00': sphere } = withEntrances.entrancesMap as Record<
  string,
  Record<string, string>
>

const fullLog: Record<string, unknown> = {
  ...normal,
  entrances: (withEntrances.entrances as unknown[]).slice(0, FEW_ENTRANCES),
  entrancesMap: {
    'sphere 00': Object.fromEntries(
      Object.entries(sphere ?? {}).slice(0, FEW_ENTRANCES),
    ),
  },
  requiredTrials: ['Forest Trial', 'Shadow Trial'],
  masterQuestDungeons: ['Deku Tree', 'Water Temple'],
  aKeyLensDoesNotKnow: { anything: [1, 2, 3] },
}

// Cut to 10 checks so rendering stays fast
const trimmed: Record<string, unknown> = {
  ...fullLog,
  locations: Object.fromEntries(
    Object.entries(normal.locations as Record<string, unknown>).slice(0, 10),
  ),
}

const hintedChecks = new Set(
  readHints(twoShip, lookups).flatMap((hint) => hint.checkIds),
)

// Its first 10 checks plus the ones its hints point at, so Hints is built
const twoShipTrimmed: Record<string, unknown> = {
  ...twoShip,
  checks: Object.fromEntries(
    Object.entries(twoShip.checks as Record<string, unknown>).filter(
      ([id], index) => index < 10 || hintedChecks.has(id),
    ),
  ),
  unknownKey: { anything: [1, 2, 3] },
}

const lighthouseChecks = lighthouse.checks as Record<string, unknown>
const lighthouseTrimmed: Record<string, unknown> = {
  ...lighthouse,
  checks: {
    ...Object.fromEntries(Object.entries(lighthouseChecks).slice(0, 20)),
    RC_UNKNOWN: lighthouseChecks.RC_UNKNOWN,
  },
}

const BAD_VALUES: unknown[] = [null, 42, 'x', true, [], {}, [null], { a: null }]

function damagedVariants(
  log: Record<string, unknown>,
  key: string,
): Record<string, unknown>[] {
  return [
    Object.fromEntries(Object.entries(log).filter(([name]) => name !== key)),
    ...BAD_VALUES.map((value) => ({ ...log, [key]: value })),
  ]
}

// SeedView's error boundary hides crashes, so the console.error spy catches them
function renderAndClickEverything(seed: Seed): void {
  const view = render(
    <SeedView onFile={vi.fn()} onReset={vi.fn()} seed={seed} />,
  )
  const name = 'Reveal all'
  const reveal = view.queryByRole('button', { name })
  if (reveal) {
    fireEvent.click(reveal)
    const dialog = within(view.getByRole('alertdialog'))
    fireEvent.click(dialog.getByRole('button', { name }))
  }
  for (const tab of view.queryAllByRole('tab')) {
    // Radix selects a tab on mouse down, not on click
    fireEvent.mouseDown(tab)
    const panel = within(view.getByRole('tabpanel'))
    for (const button of panel.queryAllByRole('button')) fireEvent.click(button)
  }
  for (const button of view.getAllByRole('button')) fireEvent.click(button)
  view.unmount()
}

// Most keys feed only the header, so a repeat of the same sections isn't clicked again
function renderOncePerShape(): (seed: Seed) => void {
  const seen = new Set<string>()
  return (seed) => {
    const shape = JSON.stringify([seed.checks, seed.sections])
    if (seen.has(shape))
      renderAndClickEverything({ ...seed, checks: [], sections: [] })
    else {
      seen.add(shape)
      renderAndClickEverything(seed)
    }
  }
}

const renderShip = renderOncePerShape()
const renderTwoShip = renderOncePerShape()
const renderLighthouse = renderOncePerShape()

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe.each(Object.keys(fullLog))('damaged %s', (key) => {
  it('never throws when the key is removed or replaced', async () => {
    for (const log of damagedVariants(fullLog, key)) {
      // A rejection loses the whole log instead of degrading, so it fails too
      await expect(openLogText(JSON.stringify(log))).resolves.toMatchObject({
        status: 'opened',
      })
    }
  })

  it('renders every damaged variant', { timeout: 60_000 }, async () => {
    for (const log of damagedVariants(trimmed, key)) {
      renderShip(seedOf(await openLogText(JSON.stringify(log))))
      expect(console.error).not.toHaveBeenCalled()
    }
  })
})

it('keeps hints in the trimmed 2Ship log', () => {
  expect(readHints(twoShipTrimmed, lookups)).not.toHaveLength(0)
})

describe.each(Object.keys(twoShipTrimmed))('damaged 2Ship %s', (key) => {
  it(
    'opens and renders every damaged variant',
    { timeout: 60_000 },
    async () => {
      for (const log of damagedVariants(twoShipTrimmed, key)) {
        renderTwoShip(seedOf(await openLogText(JSON.stringify(log))))
        expect(console.error).not.toHaveBeenCalled()
      }
    },
  )
})

describe.each(Object.keys(lighthouseTrimmed))(
  'damaged Lighthouse %s',
  (key) => {
    it(
      'opens and renders every damaged variant',
      { timeout: 60_000 },
      async () => {
        for (const log of damagedVariants(lighthouseTrimmed, key)) {
          renderLighthouse(seedOf(await openLogText(JSON.stringify(log))))
          expect(console.error).not.toHaveBeenCalled()
        }
      },
    )
  },
)

it.each([
  ['hints', { 'Gossip Stone Hints': 42, 'Static Hints': 42 }],
  ['entrances', { entrances: 42, entrancesMap: 42 }],
])('shows a notice in place of unreadable %s', async (id, damage) => {
  const seed = seedOf(
    await openLogText(JSON.stringify({ ...trimmed, ...damage })),
  )
  expect(sectionById(seed, id).content.kind).toBe('failed')
})

it('keeps walking what it can read of damaged entrances', async () => {
  const log = {
    ...trimmed,
    entrances: [null, { index: 'x' }, { index: 0, override: 4 }],
    entrancesMap: { 'sphere 00': 7 },
  }
  const seed = seedOf(await openLogText(JSON.stringify(log)))
  expect(sectionById(seed, 'entrances').content.kind).toBe('links')
})

it('survives damage inside nested values', async () => {
  const log = {
    ...trimmed,
    locations: { a: null, b: [], c: { item: 7, price: 'x' } },
    playthrough: { 'sphere 00': 7, 'sphere 01': { a: 9 } },
    'Gossip Stone Hints': { a: 7, b: { location: 9, messages: [1] } },
    'Static Hints': { a: { locations: 'x', message: null } },
    settings: { a: { b: 1 }, 'Start with Bow': 7 },
    file_hash: ['x', null, 500],
    entrances: [null, { index: 'x' }],
    entrancesMap: { 'sphere 00': 7 },
  }
  const result = await openLogText(JSON.stringify(log))
  expect(result.status).toBe('opened')
  expect(() => {
    renderAndClickEverything(seedOf(result))
  }).not.toThrow()
  expect(console.error).not.toHaveBeenCalled()
})
