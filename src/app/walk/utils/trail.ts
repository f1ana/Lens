import type { Link } from '@/model/seed'

interface TrailStep {
  detail?: string
  label: string
  // Unset when there is nowhere to go back to, like a spawn's first step
  placeId?: string
}

export interface Trail {
  startId: string
  steps: TrailStep[]
}

export type DoorState = 'forward' | 'here' | 'on-trail'

function indexOnTrail(trail: Trail, link: Link): number {
  const { placeId } = link.landing
  if (placeId === undefined) return -1
  return trail.steps.findIndex((step) => step.placeId === placeId)
}

export function doorState(trail: Trail, link: Link): DoorState {
  const index = indexOnTrail(trail, link)
  if (index === -1) return 'forward'
  return index === trail.steps.length - 1 ? 'here' : 'on-trail'
}

export function stepBack(trail: Trail, index: number): Trail {
  return { ...trail, steps: trail.steps.slice(0, index + 1) }
}

// A place is on the trail once, so loops can't grow it
export function followDoor(trail: Trail, link: Link): Trail {
  const index = indexOnTrail(trail, link)
  if (index === trail.steps.length - 1) return trail
  if (index !== -1) return stepBack(trail, index)
  const { place, placeId, detail } = link.landing
  return {
    ...trail,
    steps: [...trail.steps, { placeId, label: place, detail }],
  }
}

export function startTrail(link: Link): Trail {
  const first: TrailStep = { placeId: link.fromPlaceId, label: link.door }
  return followDoor({ startId: link.id, steps: [first] }, link)
}
