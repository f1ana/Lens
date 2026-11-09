import {
  settingsSection,
  startingInventorySection,
} from '@/formats/lighthouse/lists'
import type { SectionBody } from '@/formats/shared/sections'
import type { RowGroup } from '@/model/seed'
import { hasRows } from '@/model/seed'

import { fixture } from '../../helpers'
import { lookups } from './data-1.2.2'

const ALL = fixture('lighthouse-1.2.2-all-shuffles.json')
const NO_LOGIC = fixture('lighthouse-1.2.2-no-logic.json')

function groupsOf(section: null | SectionBody): RowGroup[] {
  if (!section || !hasRows(section.content)) throw new Error('no rows')
  return section.content.groupings[0].groups
}

function settings(
  log: Record<string, unknown>,
): [string, string | undefined][] {
  return groupsOf(settingsSection(log, lookups)).flatMap((g) =>
    g.rows.map((r): [string, string | undefined] => [r.primary, r.secondary]),
  )
}

function inventory(log: Record<string, unknown>): Record<string, string[]> {
  return Object.fromEntries(
    groupsOf(startingInventorySection(log, lookups)).map((g) => [
      g.title,
      g.rows.map((r) => r.primary),
    ]),
  )
}

it('names settings and their values as the menu does', () => {
  expect(settings(ALL)).toContainEqual(['Logic Mode', 'Glitchless'])
  expect(settings(ALL)).toContainEqual(['Stop n Swop Hunt', 'On'])
  expect(settings(NO_LOGIC)).toContainEqual(['Logic Mode', 'No Logic'])
  expect(settings(NO_LOGIC)).toContainEqual(['Shuffle Jinjos', 'Off'])
  expect(settings(ALL)).toHaveLength(9)
})

it('shows an unnamed value or an unknown option as written', () => {
  expect(settings({ options: { RO_LOGIC: 7, RO_NEW: 1 } })).toEqual([
    ['Logic Mode', '7'],
    ['RO_NEW', '1'],
  ])
})

it('shows values that name built-in object keys as written', () => {
  expect(
    settings({
      options: { RO_LOGIC: '__proto__', RO_SPAWN_JUNK: 'constructor' },
    }),
  ).toEqual([
    ['Logic Mode', '__proto__'],
    ['Spawn Junk For Obtained Checks', 'constructor'],
  ])
})

it('has no settings section without options, and fails on bad ones', () => {
  expect(settingsSection({}, lookups)).toBeNull()
  expect(() => settingsSection({ options: 42 }, lookups)).toThrow()
})

it('lists the starting abilities, then the items', () => {
  expect(inventory(NO_LOGIC)).toEqual({
    Abilities: ['Jump Higher', 'First Note Door', 'Camera Control', 'Eggs'],
    Items: ['Blue Eggs'],
  })
  expect(startingInventorySection(NO_LOGIC, lookups)?.count).toBe(5)
})

it('shows loadout values Lens has no name for as written', () => {
  expect(inventory({ loadout: { abilities: [10, 'x', 999] } })).toEqual({
    Abilities: ['Jump Higher', 'x', '999'],
  })
})

it('has no inventory section without a loadout, and fails on bad ones', () => {
  expect(startingInventorySection({}, lookups)).toBeNull()
  expect(() => startingInventorySection({ loadout: 42 }, lookups)).toThrow()
  expect(() =>
    startingInventorySection({ loadout: { abilities: 42 } }, lookups),
  ).toThrow()
})
