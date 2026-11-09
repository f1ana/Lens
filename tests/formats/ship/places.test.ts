import { placeName } from '@/formats/ship/places'

import { lookups, SHIP_DATA } from './data-9.3.1'

const { places } = lookups
const place = (door: string) => places.doorPlaceId(door)

it('names a place with no known scene after its region', () => {
  const door = {
    source: 'New Door',
    destination: 'New Room',
    group: 'New Region',
    type: 'Overworld',
    scenes: ['SCENE_NOT_NAMED_YET'],
  }
  expect(placeName(door)).toBe('New Region')
})

it('merges the scenes Shipwright lists on one row', () => {
  expect(place('MK Mask Shop Entry')).toBe(place('Market South Exit'))
  expect(place('Castle Grounds South Exit')).toBe(
    place('OGC Rainbow Bridge Exit'),
  )
  expect(place('Market Entrance North Exit')).not.toBe(
    place('Market South Exit'),
  )
})

it('keeps doors of a shared scene apart', () => {
  expect(place('HF Tektite Grotto')).not.toBe(place('Kak Open Grotto'))
  expect(place('Kak Bazaar')).not.toBe(place('MK Bazaar'))
  expect(place("Impa's House Front")).not.toBe(place("Impa's House Back"))
  expect(place('Windmill')).not.toBe(place("Dampe's Grave"))
})

it('keeps a space with two doors together', () => {
  expect(place('Kak Potion Shop Front')).toBe(place('Kak Potion Shop Back'))
  expect(place('Water Temple Entrance')).toBe(place('Water Temple Boss Door'))
})

it.each(['Child Spawn', 'Adult Spawn', 'Minuet of Forest', 'Prelude of Light'])(
  'gives %s no place',
  (name) => {
    expect(place(name)).toBeUndefined()
  },
)

it('keeps owl flights and blue warps in their place', () => {
  expect(place('LH Owl Flight')).toBe(place('Lake Hylia North Exit'))
  expect(place('Gohma Blue Warp')).toBe(place('Gohma'))
})

it.each([
  ['MK Mask Shop Entry', 'Hyrule Market', 'Outside the Mask Shop'],
  ["KF Mido's House Entry", 'Kokiri Forest', "Outside Mido's House"],
  ['KF Outside Deku Tree', 'Kokiri Forest', 'Outside the Deku Tree'],
  ['Water Temple Boss Door', 'Water Temple', 'Water Temple Boss Door'],
  ['OGC Rainbow Bridge Exit', 'Castle Grounds', "Outside Ganon's Castle"],
  ['Lake Hylia River Exit', 'Lake Hylia', 'Lake Hylia River Exit'],
  ['Deku Tree Blue Warp', 'Kokiri Forest', 'Deku Tree Blue Warp'],
])('describes landing at %s', (name, placeName, detail) => {
  expect(places.landingOf(name)).toMatchObject({ place: placeName, detail })
})

it('adds no detail when it would repeat the place', () => {
  expect(places.landingOf('HF Tektite Grotto')).toEqual({
    place: 'HF Tektite Grotto',
    placeId: place('HF Tektite Grotto'),
  })
})

it('admits a landing it does not know', () => {
  expect(places.landingOf('Nowhere')).toEqual({ place: 'Nowhere' })
})

it('uses the spawn row for where a spawn lands', () => {
  expect(places.landingOf('Temple of Time').placeId).toBe(
    place('Temple of Time Entrance'),
  )
})

it('resolves every destination Shipwright names', () => {
  for (const { destination } of Object.values(SHIP_DATA.entrances))
    expect(places.landingOf(destination).placeId, destination).toBeDefined()
})

it('names every place with more than one door', () => {
  for (const { source } of Object.values(SHIP_DATA.entrances)) {
    const id = places.doorPlaceId(source)
    if (id === undefined) continue
    const facts = places.placeFacts(id)!
    expect(facts.name, source).toBeTruthy()
    if (facts.singleDoor) expect(facts.name).toBe(source)
  }
})

it('marks a one-door room and not an area', () => {
  expect(places.placeFacts(place('HF Tektite Grotto')!)?.singleDoor).toBe(true)
  expect(places.placeFacts(place('Market South Exit')!)?.singleDoor).toBe(false)
})
