import {
  doorState,
  followDoor,
  startTrail,
  stepBack,
  type Trail,
} from '@/app/walk/utils/trail'
import type { Link } from '@/model/seed'

function door(
  name: string,
  from: string | undefined,
  to: string | undefined,
): Link {
  return {
    id: name,
    door: name,
    ...(from !== undefined && { fromPlaceId: from }),
    landing: {
      place: to ?? 'Somewhere',
      ...(to !== undefined && { placeId: to }),
    },
  }
}

const places = (trail: Trail) => trail.steps.map((step) => step.placeId)

it("starts in the door's own place, labelled with the door", () => {
  const trail = startTrail(door('Lost Woods South Exit', 'woods', 'market'))
  expect(trail.startId).toBe('Lost Woods South Exit')
  expect(trail.steps).toEqual([
    { placeId: 'woods', label: 'Lost Woods South Exit' },
    { placeId: 'market', label: 'market' },
  ])
})

it('keeps the landing detail on its step', () => {
  const link = door('x', 'a', 'b')
  link.landing.detail = 'Outside the Mask Shop'
  expect(startTrail(link).steps[1]?.detail).toBe('Outside the Mask Shop')
})

it('starts a spawn with a step that has no place', () => {
  const trail = startTrail(door('Child Spawn', undefined, 'house'))
  expect(places(trail)).toEqual([undefined, 'house'])
  expect(trail.steps[0]?.label).toBe('Child Spawn')
})

it('stays put when a door lands in its own place', () => {
  expect(places(startTrail(door('Loop', 'a', 'a')))).toEqual(['a'])
})

it('moves on one step', () => {
  const trail = followDoor(startTrail(door('x', 'a', 'b')), door('y', 'b', 'c'))
  expect(places(trail)).toEqual(['a', 'b', 'c'])
})

it('marks and cuts back to a place on the trail', () => {
  const trail = followDoor(startTrail(door('x', 'a', 'b')), door('y', 'b', 'c'))
  const back = door('z', 'c', 'b')
  expect(doorState(trail, back)).toBe('on-trail')
  expect(places(followDoor(trail, back))).toEqual(['a', 'b'])
})

it("counts the starting door's place for a loop", () => {
  const trail = followDoor(
    startTrail(door('x', 'market', 'fort')),
    door('y', 'fort', 'grotto'),
  )
  const back = door('exit', 'grotto', 'market')
  expect(doorState(trail, back)).toBe('on-trail')
  expect(places(followDoor(trail, back))).toEqual(['market'])
})

it('stays when a door leads back to the current place', () => {
  const trail = startTrail(door('x', 'a', 'b'))
  const here = door('y', 'b', 'b')
  expect(doorState(trail, here)).toBe('here')
  expect(followDoor(trail, here)).toBe(trail)
})

it('never repeats a place', () => {
  let trail = startTrail(door('x', 'a', 'b'))
  for (const next of [
    door('1', 'b', 'c'),
    door('2', 'c', 'a'),
    door('3', 'a', 'b'),
  ])
    trail = followDoor(trail, next)
  const ids = places(trail)
  expect(new Set(ids).size).toBe(ids.length)
})

it('treats an unknown landing as somewhere new', () => {
  const trail = startTrail(door('x', 'a', undefined))
  expect(doorState(trail, door('y', 'a', undefined))).toBe('forward')
})

it('steps back to an earlier place', () => {
  const trail = followDoor(startTrail(door('x', 'a', 'b')), door('y', 'b', 'c'))
  expect(places(stepBack(trail, 0))).toEqual(['a'])
})
