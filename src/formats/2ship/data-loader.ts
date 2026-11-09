import { loadRelease } from '@/formats/shared/release-data'

import { MINIMUM_VERSION } from './build'
import type { TwoShipFiles, TwoShipLookups } from './lookups'
import { buildTwoShipLookups, toTwoShipData } from './lookups'

const FILES = {
  areas: import.meta.glob<TwoShipFiles['areas']>('./data/*/areas.json', {
    import: 'default',
  }),
  checks: import.meta.glob<TwoShipFiles['checks']>('./data/*/checks.json', {
    import: 'default',
  }),
  items: import.meta.glob<TwoShipFiles['items']>('./data/*/items.json', {
    import: 'default',
  }),
  options: import.meta.glob<TwoShipFiles['options']>('./data/*/options.json', {
    import: 'default',
  }),
}

export async function loadTwoShipLookups(
  release: null | string,
): Promise<TwoShipLookups> {
  const files = await loadRelease<TwoShipFiles>(release, MINIMUM_VERSION, FILES)
  return buildTwoShipLookups(toTwoShipData(files))
}
