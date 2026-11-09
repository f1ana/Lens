import { lookups } from './data-1.2.2'

it('finds checks by number and by code', () => {
  expect(lookups.checkByNumber(1072)?.name).toBe('Molehill Attack')
  expect(lookups.checkByNumber(0)).toBeUndefined()
  expect(lookups.checkByCode('RC_BGS_JIGGY_CROCTUS')?.world).toBe(
    'Bubblegloop Swamp',
  )
  expect(lookups.checkByCode('RC_UNKNOWN')).toBeUndefined()
})

it('finds items, abilities and loadout names by number', () => {
  expect(lookups.itemByNumber(8)?.code).toBe('RI_MOLEHILL')
  expect(lookups.itemByNumber(0)?.name).toBe('Unknown')
  expect(lookups.itemByNumber(99)).toBeUndefined()
  expect(lookups.abilityName(4)).toBe('Claw Swipe')
  expect(lookups.abilityName(99)).toBeUndefined()
  expect(lookups.loadoutAbility(19)).toBe('First Note Door')
  expect(lookups.loadoutItem(13)).toBe('Blue Eggs')
})

it('knows its release and the world and type order', () => {
  expect(lookups.release).toBe('1.2.2')
  expect(lookups.worldOrder[0]).toBe('Spiral Mountain')
  expect(lookups.typeOrder[0]).toBe('Empty Honeycomb')
  expect(lookups.options.get('RO_LOGIC')?.label).toBe('Logic Mode')
})
