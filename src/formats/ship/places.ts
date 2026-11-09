import type { Landing, Link, Place } from '@/model/seed'

export interface Entrance {
  destination: string
  group: string
  landingScene?: string
  scenes: string[]
  source: string
  type: string
}

// Spawns and warp songs start from nowhere in particular
const ANYWHERE_GROUP = 'One Way'

// Scenes that hold unrelated rooms, or rooms a player can't walk between
const SHARED_SCENES = new Set([
  'SCENE_GROTTOS',
  'SCENE_FAIRYS_FOUNTAIN',
  'SCENE_GREAT_FAIRYS_FOUNTAIN_MAGIC',
  'SCENE_GREAT_FAIRYS_FOUNTAIN_SPELLS',
  'SCENE_SHOOTING_GALLERY',
  'SCENE_BAZAAR',
  'SCENE_LON_LON_BUILDINGS',
  'SCENE_IMPAS_HOUSE',
  'SCENE_WINDMILL_AND_DAMPES_GRAVE',
])

const PLACE_NAMES: Partial<Record<string, string>> = {
  SCENE_DEATH_MOUNTAIN_CRATER: 'Death Mountain Crater',
  SCENE_DEATH_MOUNTAIN_TRAIL: 'Death Mountain Trail',
  SCENE_DESERT_COLOSSUS: 'Desert Colossus',
  SCENE_GERUDOS_FORTRESS: 'Gerudo Fortress',
  SCENE_GERUDO_VALLEY: 'Gerudo Valley',
  SCENE_GORON_CITY: 'Goron City',
  SCENE_GRAVEYARD: 'Graveyard',
  SCENE_HAUNTED_WASTELAND: 'Haunted Wasteland',
  SCENE_HYRULE_CASTLE: 'Castle Grounds',
  SCENE_HYRULE_FIELD: 'Hyrule Field',
  SCENE_KAKARIKO_VILLAGE: 'Kakariko Village',
  SCENE_KOKIRI_FOREST: 'Kokiri Forest',
  SCENE_LAKE_HYLIA: 'Lake Hylia',
  SCENE_LON_LON_RANCH: 'Lon Lon Ranch',
  SCENE_LOST_WOODS: 'Lost Woods',
  SCENE_MARKET_DAY: 'Hyrule Market',
  SCENE_MARKET_ENTRANCE_DAY: 'Market Entrance',
  SCENE_SACRED_FOREST_MEADOW: 'Sacred Forest Meadow',
  SCENE_TEMPLE_OF_TIME_EXTERIOR_DAY: 'Temple of Time Courtyard',
  SCENE_ZORAS_DOMAIN: "Zora's Domain",
  SCENE_ZORAS_FOUNTAIN: "Zora's Fountain",
  SCENE_ZORAS_RIVER: "Zora's River",
  SCENE_THIEVES_HIDEOUT: "Thieves' Hideout",
  SCENE_POTION_SHOP_KAKARIKO: 'Kak Potion Shop',
  SCENE_INSIDE_GANONS_CASTLE: "Inside Ganon's Castle",
  SCENE_DEKU_TREE: 'Deku Tree',
  SCENE_DODONGOS_CAVERN: "Dodongo's Cavern",
  SCENE_JABU_JABU: "Jabu Jabu's Belly",
  SCENE_FOREST_TEMPLE: 'Forest Temple',
  SCENE_FIRE_TEMPLE: 'Fire Temple',
  SCENE_WATER_TEMPLE: 'Water Temple',
  SCENE_SHADOW_TEMPLE: 'Shadow Temple',
  SCENE_SPIRIT_TEMPLE: 'Spirit Temple',
  SCENE_DEKU_TREE_BOSS: "Gohma's Room",
  SCENE_DODONGOS_CAVERN_BOSS: "King Dodongo's Room",
  SCENE_JABU_JABU_BOSS: "Barinade's Room",
  SCENE_FOREST_TEMPLE_BOSS: "Phantom Ganon's Room",
  SCENE_FIRE_TEMPLE_BOSS: "Volvagia's Room",
  SCENE_WATER_TEMPLE_BOSS: "Morpha's Room",
  SCENE_SHADOW_TEMPLE_BOSS: "Bongo-Bongo's Room",
  SCENE_SPIRIT_TEMPLE_BOSS: "Twinrova's Room",
}

// A scene PLACE_NAMES doesn't know yet goes by its region
export function placeName(first: Entrance, others: Entrance[] = []): string {
  const name = [first, ...others]
    .flatMap((door) => door.scenes)
    .map((scene) => PLACE_NAMES[scene])
    .find((found) => found !== undefined)
  return name ?? first.group
}

const ROOM_TYPES = new Set(['Interior', 'Grotto', 'Dungeon'])

export interface EntrancePair {
  destination: string
  door: string
  id: string
}

export interface Places {
  // A door named twice keeps its first
  buildWalk(pairs: readonly EntrancePair[]): {
    links: Record<string, Link>
    places: Record<string, Place>
  }
  doorPlaceId(source: string): string | undefined
  entranceFrom(source: string): Entrance | undefined
  landingOf(name: string): Landing
  placeFacts(id: string): undefined | { name: string; singleDoor: boolean }
}

export function createPlaces(entrances: Record<string, Entrance>): Places {
  const all = Object.values(entrances)

  // A row lists several scenes when they are versions of one place
  const samePlace = new Map<string, string>()
  for (const { scenes } of all) {
    const [first] = scenes
    if (first !== undefined && scenes.length > 1)
      for (const scene of scenes) samePlace.set(scene, first)
  }

  const scenePlaceId = (scene: string): string =>
    `place:${samePlace.get(scene) ?? scene}`

  const placeIdOf = (door: Entrance): string | undefined => {
    const scene = door.scenes[0]
    if (scene === undefined || door.group === ANYWHERE_GROUP) return undefined
    return SHARED_SCENES.has(scene)
      ? `place:door:${door.source}`
      : scenePlaceId(scene)
  }

  const bySource = new Map(all.map((e) => [e.source, e]))
  const byDestination = new Map(all.map((e) => [e.destination, e]))

  const doorsOf = new Map<string, Entrance[]>()
  for (const door of all) {
    const id = placeIdOf(door)
    if (id === undefined) continue
    const doors = doorsOf.get(id)
    if (doors) doors.push(door)
    else doorsOf.set(id, [door])
  }

  const entranceFrom = (source: string): Entrance | undefined =>
    bySource.get(source)

  const doorPlaceId = (source: string): string | undefined => {
    const door = bySource.get(source)
    return door && placeIdOf(door)
  }

  const placeFacts = (
    id: string,
  ): undefined | { name: string; singleDoor: boolean } => {
    const [first, ...others] = doorsOf.get(id) ?? []
    if (!first) return undefined
    return others.length === 0
      ? { name: first.source, singleDoor: true }
      : { name: placeName(first, others), singleDoor: false }
  }

  const landingPlaceId = (name: string): string | undefined => {
    const id = doorPlaceId(name)
    if (id !== undefined) return id
    const entry = byDestination.get(name)
    if (!entry) return undefined
    // A spawn's table row can point elsewhere, and only its own row says where
    const scene =
      entry.group === ANYWHERE_GROUP
        ? (entry.scenes[0] ?? entry.landingScene)
        : entry.landingScene
    return scene === undefined || SHARED_SCENES.has(scene)
      ? undefined
      : scenePlaceId(scene)
  }

  const detailOf = (name: string, placeId: string): string => {
    const door = bySource.get(name)
    const outdoors = doorsOf.get(placeId)?.some((d) => d.type === 'Overworld')
    if (!door || !outdoors || !ROOM_TYPES.has(door.type)) return name
    const room = door.destination
      .replace(/ Entrance$/, '')
      .replace(/^Inside /, '')
    return room.includes("'") ? `Outside ${room}` : `Outside the ${room}`
  }

  const landingOf = (name: string): Landing => {
    const placeId = landingPlaceId(name)
    const facts = placeId === undefined ? undefined : placeFacts(placeId)
    if (placeId === undefined || !facts) return { place: name }
    const detail = detailOf(name, placeId)
    return {
      place: facts.name,
      placeId,
      detail: detail === facts.name ? undefined : detail,
    }
  }

  const buildWalk = (
    pairs: readonly EntrancePair[],
  ): ReturnType<Places['buildWalk']> => {
    const links: Record<string, Link> = {}
    const places: Record<string, Place> = {}

    const placeFor = (id: string | undefined): Place | undefined => {
      if (id === undefined) return undefined
      const known = places[id]
      if (known) return known
      const facts = placeFacts(id)
      if (!facts) return undefined
      const place = { id, ...facts, doors: [] }
      places[id] = place
      return place
    }

    for (const { id, door, destination } of pairs) {
      const fromPlaceId = doorPlaceId(door)
      const landing = landingOf(destination)
      const link: Link = { id, door, fromPlaceId, landing }
      links[id] = link
      placeFor(landing.placeId)
      const from = placeFor(fromPlaceId)
      if (from && !from.doors.some((other) => other.door === door))
        from.doors.push(link)
    }

    for (const place of Object.values(places))
      place.doors.sort((a, b) => a.door.localeCompare(b.door))
    return { links, places }
  }

  return { buildWalk, doorPlaceId, entranceFrom, landingOf, placeFacts }
}
