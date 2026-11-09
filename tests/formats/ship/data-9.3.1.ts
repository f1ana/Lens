import areas from '@/formats/ship/data/9.3.1/areas.json'
import checkTypes from '@/formats/ship/data/9.3.1/check-types.json'
import entrances from '@/formats/ship/data/9.3.1/entrances.json'
import hashIcons from '@/formats/ship/data/9.3.1/hash-icons.json'
import type { ShipData } from '@/formats/ship/lookups'
import { buildShipLookups } from '@/formats/ship/lookups'

export const SHIP_DATA: ShipData = { areas, checkTypes, entrances, hashIcons }

export const lookups = buildShipLookups(SHIP_DATA)
