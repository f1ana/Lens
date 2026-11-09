import { readChecks } from '@/formats/2ship/checks'
import type { WorkedOutHint } from '@/formats/2ship/hints'
import { attachHints, hintsSection, readHints } from '@/formats/2ship/hints'
import { hasRows } from '@/model/seed'

import { fixture, open, rowsOf, sectionById } from '../../helpers'
import { lookups } from './data-5.0.1'

const ALL = '2ship-5.0.1-all-shuffles.json'
const PLENTIFUL = '2ship-5.0.1-no-logic-plentiful.json'

const hintsOf = (name: string) => readHints(fixture(name), lookups)
const byLabel = (hints: WorkedOutHint[], label: string) =>
  hints.find((h) => h.label === label)

it('finds a hinted item where the log puts it', () => {
  expect(byLabel(hintsOf(ALL), 'Hookshot')).toEqual({
    label: 'Hookshot',
    text: 'Treasure in Romani Ranch',
    checkIds: ['RC_ROMANI_RANCH_WONDER_ITEM_04'],
  })
})

it('picks the first placement in the game’s order under Plentiful Items', () => {
  expect(byLabel(hintsOf(PLENTIFUL), 'Hookshot')?.checkIds).toEqual([
    'RC_GREAT_BAY_TEMPLE_GREEN_PIPE_1_POT_02',
  ])
})

it('lists every placement of a transformation mask', () => {
  expect(byLabel(hintsOf(PLENTIFUL), "Butler's Son")?.checkIds).toEqual([
    'RC_MOON_TRIAL_GORON_POT_02',
    'RC_OCEAN_SPIDER_HOUSE_WONDER_ITEM_08',
  ])
})

it('joins the locations of a transformation mask', () => {
  const log = {
    options: { RO_HINTS_TRANSFORMATIONS: 1 },
    checks: {
      RC_BOMB_SHOP_ITEM_01: 'RI_MASK_ZORA',
      RC_ROMANI_RANCH_WONDER_ITEM_04: 'RI_MASK_ZORA',
    },
  }
  expect(readHints(log, lookups)).toEqual([
    {
      label: 'Mikau',
      text: 'in West Clock Town & in Romani Ranch',
      checkIds: ['RC_BOMB_SHOP_ITEM_01', 'RC_ROMANI_RANCH_WONDER_ITEM_04'],
    },
  ])
})

it("says a mask given at the start is in Link's pocket", () => {
  expect(byLabel(hintsOf('2ship-5.0.1-vanilla.json'), "Butler's Son")).toEqual({
    label: "Butler's Son",
    text: "Link's pocket",
    checkIds: ['RC_STARTING_ITEM_DEKU_MASK'],
  })
})

it("says Link's pocket when a mask is also placed elsewhere", () => {
  const log = {
    options: { RO_HINTS_TRANSFORMATIONS: 1 },
    checks: {
      RC_BOMB_SHOP_ITEM_01: 'RI_MASK_DEKU',
      RC_STARTING_ITEM_DEKU_MASK: 'RI_MASK_DEKU',
    },
  }
  expect(readHints(log, lookups)).toEqual([
    {
      label: "Butler's Son",
      text: "Link's pocket",
      checkIds: ['RC_BOMB_SHOP_ITEM_01', 'RC_STARTING_ITEM_DEKU_MASK'],
    },
  ])
})

it('gives one hint for each boss remains', () => {
  const hints = hintsOf(ALL)
  expect(
    ['Odolwa', 'Goht', 'Gyorg', 'Twinmold'].map((label) =>
      byLabel(hints, label)?.text.startsWith('Last seen '),
    ),
  ).toEqual([true, true, true, true])
})

it('orders the hints as the table does', () => {
  expect(hintsOf(ALL).map((h) => h.label)).toEqual([
    'Odolwa',
    'Goht',
    'Gyorg',
    'Twinmold',
    "Butler's Son",
    'Darmani',
    'Mikau',
    'Hookshot',
    'Oath to Order',
    'Song of Soaring',
    'Swamp Spider House',
    'Oceanside Spider House',
    'Bank Reward',
    'Gold Dust',
  ])
})

it('skips a hint whose setting is off', () => {
  const log = fixture(ALL)
  const options = { ...(log.options as object), RO_HINTS_HOOKSHOT: 0 }
  expect(
    byLabel(readHints({ ...log, options }, lookups), 'Hookshot'),
  ).toBeUndefined()
})

it('skips a hint whose item is not in the log', () => {
  const log = { options: { RO_HINTS_HOOKSHOT: 1 }, checks: {} }
  expect(readHints(log, lookups)).toEqual([])
})

it('gives the gold dust hint with no setting', () => {
  const log = {
    options: {},
    checks: { RC_TERMINA_FIELD_BUTTERFLY_02: 'RI_BOTTLE_GOLD_DUST' },
  }
  expect(readHints(log, lookups).map((h) => h.label)).toEqual(['Gold Dust'])
})

it('reads the item for a fixed-check hint', () => {
  const hint = byLabel(hintsOf(ALL), 'Bank Reward')
  expect(hint?.text).toBe(`Offers ${lookups.itemName('RI_MAGIC_JAR_BIG')}`)
  expect(hint?.checkIds).toEqual(['RC_CLOCK_TOWN_WEST_BANK_PIECE_OF_HEART'])
})

it('reads the item of a fixed check that holds a price', () => {
  const log = {
    options: { RO_HINTS_BANK_SIGN: 1 },
    checks: {
      RC_CLOCK_TOWN_WEST_BANK_PIECE_OF_HEART: {
        price: 5,
        randoItemId: 'RI_HOOKSHOT',
      },
    },
  }
  expect(readHints(log, lookups)[0]?.text).toBe(
    `Offers ${lookups.itemName('RI_HOOKSHOT')}`,
  )
})

it('breaks a tie between unknown checks by their order in the log', () => {
  const log = {
    options: { RO_HINTS_HOOKSHOT: 1 },
    checks: { RC_NEW_B: 'RI_HOOKSHOT', RC_NEW_A: 'RI_HOOKSHOT' },
  }
  expect(readHints(log, lookups)[0]?.checkIds).toEqual(['RC_NEW_B'])
})

it('ranks a known check before an unknown one', () => {
  const log = {
    options: { RO_HINTS_HOOKSHOT: 1 },
    checks: {
      RC_NEW_A: 'RI_HOOKSHOT',
      RC_ROMANI_RANCH_WONDER_ITEM_04: 'RI_HOOKSHOT',
    },
  }
  expect(readHints(log, lookups)[0]?.checkIds).toEqual([
    'RC_ROMANI_RANCH_WONDER_ITEM_04',
  ])
})

it.each([
  [{ options: 'on', checks: { RC_A: 'RI_HOOKSHOT' } }],
  [{ options: { RO_HINTS_HOOKSHOT: 1 }, checks: ['RI_HOOKSHOT'] }],
  [{ options: null, checks: null }],
  [{}],
  [{ options: { RO_HINTS_BANK_SIGN: 1 }, checks: { RC_A: null } }],
])('works out nothing from damaged data %#', (log) => {
  expect(readHints(log, lookups)).toEqual([])
})

it('hides hints and says which ones Lens can’t list', () => {
  const section = sectionById(open(ALL).seed, 'hints')
  expect(section.spoilerCount).toBe(true)
  expect(section.note).toBe(
    'Gossip stone, paid and Saria’s Song hints are decided during play, so they aren’t listed.',
  )
  expect(section.count).toBe(14)
  expect(
    rowsOf(section)
      .flatMap((g) => g.rows)
      .every((row) => row.kind === 'concealed'),
  ).toBe(true)
})

it('shows each hint as a concealed row of its label and text', () => {
  const section = hintsSection([
    { label: 'Hookshot', text: 'Treasure in Romani Ranch', checkIds: [] },
  ])
  expect(section && rowsOf(section)).toEqual([
    {
      title: 'Hookshot',
      rows: [
        {
          kind: 'concealed',
          id: 'hint|Hookshot',
          primary: 'Hookshot',
          secondary: 'Treasure in Romani Ranch',
        },
      ],
    },
  ])
})

it('gives each hint its own group, with its row still concealed', () => {
  const section = hintsSection([
    { label: 'Hookshot', text: 'Treasure in Romani Ranch', checkIds: [] },
    { label: 'Mikau', text: 'in Clock Town', checkIds: [] },
  ])
  const groups = section ? rowsOf(section) : []
  expect(groups.map((g) => g.title)).toEqual(['Hookshot', 'Mikau'])
  expect(groups.map((g) => g.rows.map((r) => r.kind))).toEqual([
    ['concealed'],
    ['concealed'],
  ])
})

it('shows no Hints section when nothing can be worked out', () => {
  expect(hintsSection([])).toBeNull()
})

it('marks a hinted check', () => {
  const { seed } = open(ALL)
  expect(
    seed.checks.find((c) => c.id === 'RC_ROMANI_RANCH_WONDER_ITEM_04')?.hints,
  ).toEqual([{ source: 'Hookshot', text: 'Treasure in Romani Ranch' }])
})

it('marks every check a hint names, and skips ones not in the log', () => {
  const checks = readChecks(
    { checks: { RC_BOMB_SHOP_ITEM_01: 'RI_JUNK' } },
    lookups,
  )
  attachHints(
    [
      {
        label: 'Mikau',
        text: 'in Clock Town',
        checkIds: ['RC_BOMB_SHOP_ITEM_01', 'RC_GONE'],
      },
    ],
    checks,
  )
  expect(checks[0]?.hints).toEqual([{ source: 'Mikau', text: 'in Clock Town' }])
})

it('offers the Hinted grouping once hints are attached', () => {
  const { content } = sectionById(open(ALL).seed, 'checks')
  expect(hasRows(content) && content.groupings.map((g) => g.id)).toEqual([
    'area',
    'type',
    'hinted',
  ])
})
