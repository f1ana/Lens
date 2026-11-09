import { buildShipLookups } from '@/formats/ship/lookups'

import { SHIP_DATA } from './data-9.3.1'

const lookups = buildShipLookups(SHIP_DATA)

it('orders the areas as the data does, with Other last', () => {
  expect(lookups.areaOrder[0]).toBe('Kokiri Forest')
  expect(lookups.areaOrder.at(-1)).toBe('Other')
})

it('finds an entrance by its index, and nothing for one it lacks', () => {
  expect(lookups.entrance(0)).toBe(SHIP_DATA.entrances['0'])
  expect(lookups.entrance(9999)).toBeUndefined()
})

it('carries the hash icon names', () => {
  expect(lookups.hashIcons).toEqual(SHIP_DATA.hashIcons)
})
