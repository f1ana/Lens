import { LinkRow } from '@/app/rows/LinkRow'
import type { DoorState, Trail } from '@/app/walk/utils/trail'
import { doorState } from '@/app/walk/utils/trail'
import type { Link, Place } from '@/model/seed'

import { Note } from './Note'

const BADGES: Record<DoorState, string | undefined> = {
  forward: undefined,
  'on-trail': 'Back on your trail',
  here: 'Leads back here',
}

interface DoorsProps {
  onSelect: (door: Link) => void
  place: Place | undefined
  trail: Trail
}

export function Doors({ place, trail, onSelect }: DoorsProps) {
  if (!place) return <Note>Lens doesn&apos;t know what&apos;s here</Note>
  if (place.doors.length === 0) {
    return <Note>This log doesn&apos;t list any doors here</Note>
  }
  return (
    <ul>
      {place.doors.map((door) => (
        <LinkRow
          badge={BADGES[doorState(trail, door)]}
          key={door.id}
          label={place.singleDoor ? 'Exit' : undefined}
          link={door}
          onSelect={onSelect}
        />
      ))}
    </ul>
  )
}
