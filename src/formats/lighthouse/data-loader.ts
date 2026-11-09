import { loadRelease } from '@/formats/shared/release-data'

import { MINIMUM_VERSION } from './build'
import type { LighthouseData, LighthouseLookups } from './lookups'
import { buildLighthouseLookups } from './lookups'

const FILES = {
  abilities: import.meta.glob<LighthouseData['abilities']>(
    './data/*/abilities.json',
    { import: 'default' },
  ),
  checks: import.meta.glob<LighthouseData['checks']>('./data/*/checks.json', {
    import: 'default',
  }),
  items: import.meta.glob<LighthouseData['items']>('./data/*/items.json', {
    import: 'default',
  }),
  loadout: import.meta.glob<LighthouseData['loadout']>(
    './data/*/loadout.json',
    { import: 'default' },
  ),
  options: import.meta.glob<LighthouseData['options']>(
    './data/*/options.json',
    { import: 'default' },
  ),
  source: import.meta.glob<LighthouseData['source']>('./data/*/source.json', {
    import: 'default',
  }),
  types: import.meta.glob<LighthouseData['types']>('./data/*/types.json', {
    import: 'default',
  }),
  worlds: import.meta.glob<LighthouseData['worlds']>('./data/*/worlds.json', {
    import: 'default',
  }),
}

export async function loadLighthouseLookups(): Promise<LighthouseLookups> {
  const data = await loadRelease<LighthouseData>(null, MINIMUM_VERSION, FILES)
  return buildLighthouseLookups(data)
}
