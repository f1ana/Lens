import { loadLighthouseLookups } from '@/formats/lighthouse/data-loader'

import { lookups as newest } from './data-1.2.2'

it('loads the newest data held', async () => {
  const lookups = await loadLighthouseLookups()
  expect(lookups.release).toBe('1.2.2')
  expect(lookups.checkByNumber(1072)).toEqual(newest.checkByNumber(1072))
})
