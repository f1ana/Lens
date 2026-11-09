import abilities from '@/formats/lighthouse/data/1.2.2/abilities.json'
import checks from '@/formats/lighthouse/data/1.2.2/checks.json'
import items from '@/formats/lighthouse/data/1.2.2/items.json'
import loadout from '@/formats/lighthouse/data/1.2.2/loadout.json'
import options from '@/formats/lighthouse/data/1.2.2/options.json'
import source from '@/formats/lighthouse/data/1.2.2/source.json'
import types from '@/formats/lighthouse/data/1.2.2/types.json'
import worlds from '@/formats/lighthouse/data/1.2.2/worlds.json'
import type { LighthouseData } from '@/formats/lighthouse/lookups'
import { buildLighthouseLookups } from '@/formats/lighthouse/lookups'

const LIGHTHOUSE_DATA: LighthouseData = {
  abilities,
  checks,
  items,
  loadout,
  options,
  source,
  types,
  worlds,
}

export const lookups = buildLighthouseLookups(LIGHTHOUSE_DATA)
