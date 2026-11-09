import { Buckets } from '@/formats/shared/buckets'
import type { SectionBody } from '@/formats/shared/sections'
import { PARTIAL_MESSAGE, rowCount } from '@/formats/shared/sections'
import { isRecord } from '@/lib/is-record'
import type { LinkRow } from '@/model/seed'

import type { ShipLookups } from './lookups'
import type { EntrancePair } from './places'

const OTHER_GROUP = 'Other'

export function entrancesSection(
  log: Record<string, unknown>,
  lookups: ShipLookups,
): null | SectionBody {
  const { entrancesMap, entrances: records } = log
  // Ship leaves a key out when nothing is shuffled, so any other shape is damage
  const damaged =
    (entrancesMap !== undefined && !isRecord(entrancesMap)) ||
    (records !== undefined && !Array.isArray(records))

  const pairs = new Map<string, EntrancePair>()
  const add = (door: string, destination: string): void => {
    const id = `entrances|${door}|${destination}`
    if (!pairs.has(id)) pairs.set(id, { id, door, destination })
  }

  // Sphere numbers in the map don't match the item spheres, so they are ignored
  if (isRecord(entrancesMap)) {
    for (const sphere of Object.values(entrancesMap)) {
      if (!isRecord(sphere)) continue
      for (const [source, destination] of Object.entries(sphere))
        if (typeof destination === 'string') add(source, destination)
    }
  }

  if (Array.isArray(records)) {
    for (const record of records as unknown[]) {
      if (!isRecord(record)) continue
      const { index, override } = record
      if (typeof index !== 'number' || typeof override !== 'number') continue
      add(
        lookups.entrance(index)?.source ?? `Entrance ${index}`,
        lookups.entrance(override)?.destination ?? `Entrance ${override}`,
      )
    }
  }

  const { links, places } = lookups.places.buildWalk([...pairs.values()])
  const byRegion = new Buckets()
  const byType = new Buckets()
  for (const link of Object.values(links)) {
    const { id, door, landing } = link
    const row: LinkRow = {
      kind: 'link',
      id,
      primary: door,
      secondary: pairs.get(id)?.destination,
      searchText: [landing.place, landing.detail].join(' '),
      link,
    }
    const entrance = lookups.places.entranceFrom(door)
    byRegion.add(entrance?.group ?? OTHER_GROUP, row)
    byType.add(entrance?.type ?? OTHER_GROUP, row)
  }

  const groups = byRegion.groups()
  if (groups.length === 0) {
    if (damaged) throw new Error('entrances have the wrong shape')
    return null
  }

  return {
    note: damaged ? PARTIAL_MESSAGE : undefined,
    count: rowCount(groups),
    content: {
      kind: 'links',
      places,
      groupings: [
        { id: 'region', label: 'Region', groups },
        { id: 'type', label: 'Type', groups: byType.groups() },
      ],
    },
  }
}
