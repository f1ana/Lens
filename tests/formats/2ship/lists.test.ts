import { itemListSection, settingsSection } from '@/formats/2ship/lists'
import type { Row } from '@/model/seed'

import {
  open,
  rowNames,
  rowsOf,
  sectionById,
  sectionTitles,
} from '../../helpers'
import { lookups } from './data-5.0.1'

const settings = (name: string) =>
  rowsOf(sectionById(open(name).seed, 'settings')).flatMap((g) => g.rows)
const row = (rows: Row[], primary: string) =>
  rows.find((r) => r.primary === primary)

it.each([
  ['2ship-5.0.1-all-shuffles.json', 'Glitchless'],
  ['2ship-5.0.1-no-logic-plentiful.json', 'No Logic'],
  ['2ship-5.0.1-vanilla.json', 'Vanilla'],
])('names the logic mode of %s', (name, value) => {
  expect(row(settings(name), 'Logic')?.secondary).toBe(value)
})

it('words toggles, numbers and the time', () => {
  const rows = settings('2ship-5.0.1-all-shuffles.json')
  expect(row(rows, 'Pot Drops')?.secondary).toBe('On')
  expect(row(rows, 'Plentiful Items')?.secondary).toBe('Off')
  expect(row(rows, 'Health')?.secondary).toBe('3')
  expect(row(rows, 'Final Hours Start Time')?.secondary).toBe('05:50')
})

it('groups settings under headings', () => {
  const titles = sectionTitles(
    sectionById(open('2ship-5.0.1-all-shuffles.json').seed, 'settings'),
  )
  expect(titles).toEqual(
    expect.arrayContaining(['General', 'Access', 'Hints', 'Shuffle', 'Time']),
  )
})

it('orders the headings as the game’s menu does', () => {
  const titles = sectionTitles(
    sectionById(open('2ship-5.0.1-all-shuffles.json').seed, 'settings'),
  )
  expect(titles).toEqual([
    'General',
    'Access',
    'Time',
    'Item Placement',
    'Shuffle',
    'Starting',
    'Hints',
  ])
})

it('gives each setting its code as the row id', () => {
  const rows = settings('2ship-5.0.1-all-shuffles.json')
  const ids = rows.map((r) => r.id)
  expect(new Set(ids).size).toBe(ids.length)
  expect(rows.filter((r) => r.primary === 'Boss Remains')).toHaveLength(2)
})

it('shows a setting Lens does not know', () => {
  expect(
    settingsSection({ options: { RO_BRAND_NEW: 2 } }, lookups),
  ).toMatchObject({
    content: {
      groupings: [
        {
          groups: [
            {
              title: 'General',
              rows: [{ primary: 'Brand New', secondary: '2' }],
            },
          ],
        },
      ],
    },
  })
})

it('shows an unknown choice value as its number', () => {
  const section =
    settingsSection({ options: { RO_LOGIC: 9 } }, lookups) ?? undefined
  expect(rowsOf(section)[0]?.rows[0]?.secondary).toBe('9')
})

it('shows a damaged choice value as itself', () => {
  const section =
    settingsSection({ options: { RO_LOGIC: 'constructor' } }, lookups) ??
    undefined
  expect(rowsOf(section)[0]?.rows[0]?.secondary).toBe('constructor')
})

it('shows a damaged time as it is', () => {
  const section =
    settingsSection({ options: { RO_CLOCK_TERMINAL_TIME: 'soon' } }, lookups) ??
    undefined
  expect(rowsOf(section)[0]?.rows[0]?.secondary).toBe('soon')
})

it('shows nothing without options and fails on options that are not an object', () => {
  expect(settingsSection({}, lookups)).toBeNull()
  expect(() => settingsSection({ options: 3 }, lookups)).toThrow()
})

it('names starting items and keeps repeats', () => {
  const section = itemListSection(
    ['RI_PROGRESSIVE_SWORD', 'RI_PROGRESSIVE_SWORD'],
    lookups,
  )
  expect(section?.count).toBe(2)
  expect(rowNames(section)).toEqual([
    lookups.itemName('RI_PROGRESSIVE_SWORD'),
    lookups.itemName('RI_PROGRESSIVE_SWORD'),
  ])
})

it('shows nothing for a missing list and fails on one that is not a list', () => {
  expect(itemListSection(undefined, lookups)).toBeNull()
  expect(() => itemListSection('RI_BOW', lookups)).toThrow()
})

it('shows Saria’s priority items in order', () => {
  const names = rowNames(
    sectionById(open('2ship-5.0.1-all-shuffles.json').seed, 'saria-priority'),
  )
  expect(names).toHaveLength(12)
  expect(names[0]).toBe(lookups.itemName('RI_BOW'))
})

it('has only the sections the log can fill', () => {
  expect(
    open('2ship-5.0.1-all-shuffles.json').seed.sections.map((s) => s.id),
  ).toEqual([
    'checks',
    'songs',
    'hints',
    'settings',
    'starting-inventory',
    'saria-priority',
  ])
})
