import { PARTIAL_MESSAGE } from '@/formats/shared/sections'
import { readChecks } from '@/formats/ship/checks'
import {
  attachHints,
  cleanHintText,
  HINT_NOTE,
  hintsSection,
} from '@/formats/ship/hints'

import {
  checkNamed,
  checksHintedBy,
  fixture,
  open,
  rowCount,
  rowsOf,
  sectionById,
  sectionTitles,
} from '../../helpers'
import { lookups } from './data-9.3.1'

const log = fixture('normal.json')

it('groups Way of the Hero and foolish by distribution, with a note', () => {
  const section = hintsSection(log)
  expect(sectionTitles(section)).toEqual(
    expect.arrayContaining([
      'Way of the Hero hints',
      'Foolish hints',
      'Gossip stone hints',
      'Static hints',
    ]),
  )
  expect(section?.note).toBe(HINT_NOTE)
})

it('puts warp song destinations in their own group', () => {
  const section = hintsSection({
    'Static Hints': { 'Minuet of Forest Destination': { message: 'Warp?' } },
  })
  expect(sectionTitles(section)).toEqual(['Warp song destinations'])
})

it('shows a hint without text as No text', () => {
  const section = hintsSection({ 'Gossip Stone Hints': { Stone: {} } })
  expect(rowsOf(section!)[0]?.rows[0]).toMatchObject({
    primary: 'Stone',
    secondary: 'No text',
  })
})

it('joins several messages with a blank line', () => {
  const section = hintsSection({
    'Static Hints': { Hint: { messages: ['One', 'Two'] } },
  })
  expect(rowsOf(section!)[0]?.rows[0]?.secondary).toBe('One\n\nTwo')
})

it('hides the section when the log has no hints', () => {
  expect(hintsSection({})).toBeNull()
})

it('marks a check from a gossip hint', () => {
  const { seed } = open('normal.json')
  expect(checkNamed(seed, 'Sheik at Colossus').hints[0]).toEqual({
    source: 'KF Gossip Stone',
    text: 'They say that Desert Colossus is on the way of the hero.',
  })
})

it('marks a check from a static hint', () => {
  const { seed } = open('normal.json')
  expect(
    checkNamed(seed, 'Shadow Temple Invisible Blades Visible Chest').hints.map(
      (h) => h.source,
    ),
  ).toContain('Ganondorf Hint')
})

it('marks every check in a hint with several locations', () => {
  const { seed } = open('normal.json')
  for (const name of ['King Dodongo', 'Twinrova', 'Phantom Ganon'])
    expect(checkNamed(seed, name).hints.map((h) => h.source)).toContain(
      'ToT Altar as Child',
    )
})

const SARIA_TEXT =
  'Did you feel the surge of magic recently? A mysterious bird told me it came from the Graveyard. You should check that place out, Link!'

it('shows a hint once when its messages only differ by control characters', () => {
  const { seed } = open('normal.json')
  const row = rowsOf(sectionById(seed, 'hints'))
    .flatMap((group) => group.rows)
    .find((r) => r.primary === "Saria's Magic Hint")
  expect(row?.secondary).toBe(SARIA_TEXT)
  expect(
    checkNamed(seed, 'Graveyard Heart Piece Grave Chest').hints,
  ).toContainEqual({ source: "Saria's Magic Hint", text: SARIA_TEXT })
})

it('does not tag checks from foolish hints', () => {
  expect(
    checksHintedBy(open('normal.json').seed, 'HF Cow Grotto Gossip Stone'),
  ).toHaveLength(0)
})

it('does not add the same hint to a check twice', () => {
  const checks = readChecks({ locations: { A: 'Bow' } }, lookups)
  const doubled = {
    'Gossip Stone Hints': { Stone: { location: 'A', locations: ['A'] } },
  }
  attachHints(doubled, checks)
  expect(checks[0]!.hints).toHaveLength(1)
})

it('works out Skulltula hints from settings', () => {
  const { seed } = open('normal.json')
  expect(checkNamed(seed, 'Kak 30 Gold Skulltula Reward').hints).toContainEqual(
    {
      source: '30 Skulltula hint',
      text: 'The 30 Skulltula hint points here',
    },
  )
  expect(
    checkNamed(seed, 'Kak 40 Gold Skulltula Reward').hints.map((h) => h.source),
  ).not.toContain('40 Skulltula hint')
})

it('skips a worked-out hint whose check is not in the log', () => {
  const checks = readChecks({ locations: {} }, lookups)
  expect(() => {
    attachHints({ settings: { '100 GS Hint': 'On' } }, checks)
  }).not.toThrow()
})

it('works out Item-type static hints from settings', () => {
  const itemLog = {
    locations: { 'Market 10 Big Poes': 'Bow' },
    settings: { 'Big Poes Hint': 'On' },
  }
  const checks = readChecks(itemLog, lookups)
  attachHints(itemLog, checks)
  expect(checks[0]!.hints[0]!.text).toBe('The Big Poes hint points here')
})

// Written out by hand so that a slip in WORKED_OUT_HINTS can't agree with itself.
it.each([
  ['10 GS Hint', '10 Skulltula', ['Kak 10 Gold Skulltula Reward']],
  ['20 GS Hint', '20 Skulltula', ['Kak 20 Gold Skulltula Reward']],
  ['30 GS Hint', '30 Skulltula', ['Kak 30 Gold Skulltula Reward']],
  ['40 GS Hint', '40 Skulltula', ['Kak 40 Gold Skulltula Reward']],
  ['50 GS Hint', '50 Skulltula', ['Kak 50 Gold Skulltula Reward']],
  ['100 GS Hint', '100 Skulltula', ['Kak 100 Gold Skulltula Reward']],
  ['Hyrule Loach Hint', 'Hyrule Loach', ['LH Hyrule Loach Reward']],
  [
    'Horseback Archery Hint',
    'Horseback Archery',
    ['GF HBA 1000 Points', 'GF HBA 1500 Points'],
  ],
  ['Malon Hint', 'Malon', ['KF Links House Cow']],
  ['Big Poes Hint', 'Big Poes', ['Market 10 Big Poes']],
  ['Chickens Hint', 'Chickens', ['Kak Anju as Child']],
  ["Biggoron's Hint", 'Biggoron', ['DMT Trade Claim Check']],
  ['Frog Ocarina Game Hint', 'Frog Ocarina Game', ['ZR Frogs Ocarina Game']],
  [
    'Ocarina of Time Hint',
    'Ocarina of Time',
    ['HF Ocarina of Time Item', 'Song from Ocarina of Time'],
  ],
  [
    'Mask Shop Hint',
    'Mask Shop',
    ['LW Deku Theater Skull Mask', 'LW Deku Theater Mask of Truth'],
  ],
])('works out the %s only when it is on', (setting, label, targets) => {
  expect(log.settings).toHaveProperty([setting])

  const hinted = (value: string) => {
    const hintLog = {
      locations: Object.fromEntries(
        [...targets, 'Somewhere Else'].map((name) => [name, 'Bow']),
      ),
      settings: { [setting]: value },
    }
    const checks = readChecks(hintLog, lookups)
    attachHints(hintLog, checks)
    return checks.filter((check) =>
      check.hints.some((hint) => hint.source === `${label} hint`),
    )
  }

  expect(hinted('On').map((check) => check.name)).toEqual(targets)
  expect(hinted('Off')).toEqual([])
})

it('fails the section when no hints can be read', () => {
  expect(() => hintsSection({ 'Gossip Stone Hints': 42 })).toThrow()
  expect(() =>
    hintsSection({ 'Gossip Stone Hints': 42, 'Static Hints': {} }),
  ).toThrow()
})

it('keeps the hints it can read and says the rest are missing', () => {
  const section = hintsSection({
    'Gossip Stone Hints': 42,
    'Static Hints': { Altar: { message: 'Find the stones' } },
  })
  expect(rowCount(section)).toBe(1)
  expect(section?.note).toContain(PARTIAL_MESSAGE)
  expect(section?.note).toContain(HINT_NOTE)
})

it('shows text-only hard-coded hints without a target', () => {
  const { seed } = open('hardcoded-no-logic.json')
  expect(rowCount(sectionById(seed, 'hints'))).toBeGreaterThanOrEqual(40)
  expect(
    seed.checks.every(
      (c) => c.hints.length === 0 || c.hints.every((h) => h.source !== ''),
    ),
  ).toBe(true)
})

it('cleans hint text', () => {
  expect(cleanHintText("Warp to\nZora's Domain?\n\u001bOK\nNo")).toBe(
    "Warp to\nZora's Domain?\nOK\nNo",
  )
  expect(cleanHintText('Wake up, @.')).toBe('Wake up, Link.')
})

it('survives hints of the wrong shape', () => {
  const damaged = {
    'Gossip Stone Hints': { a: 7, b: { location: 9, locations: 'x' } },
    'Static Hints': [1],
  }
  expect(() => hintsSection(damaged)).not.toThrow()
  expect(() => {
    attachHints(damaged, [])
  }).not.toThrow()
})

it('keeps every hint concealed, and offers no area to give one away', () => {
  const section = sectionById(open('normal.json').seed, 'hints')
  const rows = rowsOf(section).flatMap((group) => group.rows)
  expect(rows.length).toBeGreaterThan(0)
  expect(rows.every((row) => row.kind === 'concealed')).toBe(true)
  expect(
    section.content.kind === 'rows' && section.content.groupings,
  ).toHaveLength(1)
})
