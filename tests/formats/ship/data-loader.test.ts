import areas from '@/formats/ship/data/9.3.0/areas.json'
import checkTypes from '@/formats/ship/data/9.3.0/check-types.json'
import entrances from '@/formats/ship/data/9.3.0/entrances.json'
import hashIcons from '@/formats/ship/data/9.3.0/hash-icons.json'
import { loadShipLookups } from '@/formats/ship/data-loader'
import { buildShipLookups } from '@/formats/ship/lookups'

import { lookups as newest } from './data-9.3.1'

const older = buildShipLookups({ areas, checkTypes, entrances, hashIcons })

// 9.3.1 fixed the typo in this check's name, so only 9.3.0 has a type for it.
const RENAMED = 'Spirit Temple Notheast Boulder Silver'

it('loads the exact release', async () => {
  const lookups = await loadShipLookups('9.3.0')
  expect(lookups.areaOrder).toEqual(older.areaOrder)
  expect(lookups.checkTypeOf(RENAMED)).toBe(older.checkTypeOf(RENAMED))
  expect(lookups.checkTypeOf(RENAMED)).not.toBe(newest.checkTypeOf(RENAMED))
})

it('uses the newest for an unknown or null version', async () => {
  for (const version of ['9.9.9', null]) {
    const lookups = await loadShipLookups(version)
    expect(lookups.areaOrder).toEqual(newest.areaOrder)
    expect(lookups.checkTypeOf(RENAMED)).toBe(newest.checkTypeOf(RENAMED))
  }
})
