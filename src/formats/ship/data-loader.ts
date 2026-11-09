import { loadRelease } from '@/formats/shared/release-data'

import type { ShipData, ShipLookups } from './lookups'
import { buildShipLookups } from './lookups'
import { MINIMUM_VERSION } from './version'

const FILES = {
  areas: import.meta.glob<ShipData['areas']>('./data/*/areas.json', {
    import: 'default',
  }),
  checkTypes: import.meta.glob<ShipData['checkTypes']>(
    './data/*/check-types.json',
    { import: 'default' },
  ),
  entrances: import.meta.glob<ShipData['entrances']>(
    './data/*/entrances.json',
    { import: 'default' },
  ),
  hashIcons: import.meta.glob<ShipData['hashIcons']>(
    './data/*/hash-icons.json',
    { import: 'default' },
  ),
}

export async function loadShipLookups(
  version: null | string,
): Promise<ShipLookups> {
  return buildShipLookups(
    await loadRelease<ShipData>(version, MINIMUM_VERSION, FILES),
  )
}
