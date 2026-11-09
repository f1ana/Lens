import areas from '@/formats/2ship/data/5.0.1/areas.json'
import checks from '@/formats/2ship/data/5.0.1/checks.json'
import items from '@/formats/2ship/data/5.0.1/items.json'
import options from '@/formats/2ship/data/5.0.1/options.json'
import type { TwoShipData } from '@/formats/2ship/lookups'
import { buildTwoShipLookups, toTwoShipData } from '@/formats/2ship/lookups'

export const TWO_SHIP_DATA: TwoShipData = toTwoShipData({
  areas,
  checks,
  items,
  options,
})

export const lookups = buildTwoShipLookups(TWO_SHIP_DATA)
