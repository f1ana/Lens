import { loadTwoShipLookups } from '@/formats/2ship/data-loader'

import { lookups as newest } from './data-5.0.1'

const CHECK = 'RC_BOMB_SHOP_ITEM_01'

// 2Ship holds one release, so the exact, unknown and null cases all load it.
it('loads the release it holds', async () => {
  const lookups = await loadTwoShipLookups('5.0.1')
  expect(lookups.areaOrder).toEqual(newest.areaOrder)
  expect(lookups.checkData(CHECK)).toEqual(newest.checkData(CHECK))
})
