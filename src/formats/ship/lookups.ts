import type { AreaPrefix } from './areas'
import { createAreas } from './areas'
import { createCheckTypes } from './check-types'
import type { Entrance, Places } from './places'
import { createPlaces } from './places'

export interface ShipData {
  areas: AreaPrefix[]
  checkTypes: Record<string, string>
  entrances: Record<string, Entrance>
  hashIcons: string[]
}

export interface ShipLookups {
  areaOf(checkName: string): string
  // In display order, with unknown checks last
  areaOrder: string[]
  checkTypeOf(checkName: string): string
  // The table row for a log's numeric entrance index
  entrance(index: number): Entrance | undefined
  hashIcons: readonly string[]
  places: Places
}

export function buildShipLookups(data: ShipData): ShipLookups {
  const { areaOf, areaOrder } = createAreas(data.areas)
  const { entrances } = data
  return {
    areaOf,
    areaOrder,
    checkTypeOf: createCheckTypes(data.checkTypes),
    entrance(index) {
      const key = String(index)
      return Object.hasOwn(entrances, key) ? entrances[key] : undefined
    },
    hashIcons: data.hashIcons,
    places: createPlaces(entrances),
  }
}
