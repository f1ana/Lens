import { buildTwoShipLookups } from '@/formats/2ship/lookups'

import { TWO_SHIP_DATA } from './data-5.0.1'

const lookups = buildTwoShipLookups(TWO_SHIP_DATA)

it('names an item, and falls back to its readable code for one it lacks', () => {
  expect(lookups.itemName('RI_ARROW_FIRE')).toBe('Fire Arrows')
  expect(lookups.itemName('RI_NOT_A_THING')).toBe('Not A Thing')
})

it('ranks a check it does not know last', () => {
  expect(lookups.checkRank('RC_BRAND_NEW_CHECK')).toBe(Infinity)
})

it('holds the values of a choice setting', () => {
  expect(lookups.choices.get('RO_ACCESS_DUNGEONS')?.get('4')).toBe('Open')
  expect(lookups.choices.get('RO_ACCESS_DUNGEONS')?.size).toBe(5)
})
