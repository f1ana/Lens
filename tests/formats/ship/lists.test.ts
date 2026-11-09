import { listSection, otherDataSection } from '@/formats/shared/sections'
import { settingsSection, startingInventorySection } from '@/formats/ship/lists'

import { fixture, rowNames } from '../../helpers'

it('splits starting inventory out of settings', () => {
  const log = {
    settings: {
      'Start with Bow': 'On',
      'Start with Boomerang': 'Off',
      'Starting Bottle 1': 'None',
      'Starting Hearts': '4',
      'Rainbow Bridge': 'Open',
      'Starting Age': 'Child',
    },
  }
  expect(rowNames(startingInventorySection(log))).toEqual([
    'Start with Bow',
    'Starting Hearts',
  ])
  expect(rowNames(settingsSection(log))).toEqual([
    'Rainbow Bridge',
    'Starting Age',
  ])
})

it('counts Full Wallets and Gold Skulltula Tokens as starting inventory', () => {
  const log = {
    settings: { 'Full Wallets': 'Yes', 'Gold Skulltula Tokens': '5' },
  }
  expect(rowNames(startingInventorySection(log))).toEqual([
    'Full Wallets',
    'Gold Skulltula Tokens',
  ])
  expect(rowNames(settingsSection(log))).toEqual([])
})

it('leaves out Full Wallets and Gold Skulltula Tokens when they are empty', () => {
  const log = {
    settings: { 'Full Wallets': 'No', 'Gold Skulltula Tokens': '0' },
  }
  expect(startingInventorySection(log)).toBeNull()
  expect(settingsSection(log)).toBeNull()
})

it('leaves out starting items a real log marks as No', () => {
  const names = rowNames(startingInventorySection(fixture('normal.json')))
  expect(names).toContain('Start with Stick Ammo')
  expect(names).not.toContain('Start with Magic Beans')
})

it('hides a list with no entries', () => {
  expect(listSection(undefined)).toBeNull()
  expect(listSection([])).toBeNull()
})

it('puts unknown top-level keys in Other data as text', () => {
  expect(
    otherDataSection({ version: 'x', newThing: { a: 1 } }, new Set(['version']))
      ?.content,
  ).toEqual({
    kind: 'text',
    text: JSON.stringify({ newThing: { a: 1 } }, null, 2),
  })
})
