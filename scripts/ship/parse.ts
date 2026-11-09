import {
  argumentsFrom,
  capture,
  enumItems,
  fail,
  strings,
  stripComments,
} from '../lib/cpp.ts'

export interface AreaPrefix {
  area: string
  prefix: string
}

export interface EntranceEntry {
  destination: string
  group: string
  // Unset for grottos, which have no table row
  landingScene?: string
  // Empty for warp songs, which can be played anywhere
  scenes: string[]
  source: string
  type: string
}

export const RANDOMIZER_DIR = 'soh/soh/Enhancements/randomizer'

export const FILES = {
  util: 'soh/soh/util.cpp',
  checkObjects: `${RANDOMIZER_DIR}/randomizer_check_objects.cpp`,
  miscEnums: `${RANDOMIZER_DIR}/randomizerEnums/RandomizerMiscEnums.h`,
  entranceTable: 'soh/include/tables/entrance_table.h',
  tracker: `${RANDOMIZER_DIR}/randomizer_entrance_tracker.cpp`,
  types: `${RANDOMIZER_DIR}/randomizerTypes.h`,
  hash: `${RANDOMIZER_DIR}/rando_hash.h`,
  location: `${RANDOMIZER_DIR}/location.cpp`,
  locationList: `${RANDOMIZER_DIR}/location_list.cpp`,
}

function titleCase(name: string): string {
  return name
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

function prefixesByArea(
  utilCpp: string,
  miscEnumsH: string,
): Map<string, string> {
  const prefixBlock = /rcareaPrefixes\s*=\s*\{([\s\S]*?)\}\s*;/.exec(
    stripComments(utilCpp),
  )?.[1]
  const prefixes = strings(prefixBlock ?? '')
  if (prefixes.length === 0) fail(FILES.util, 'no rcareaPrefixes rows found')

  const areas = enumItems(
    miscEnumsH,
    'RandomizerCheckArea',
    FILES.miscEnums,
  ).filter((a) => a !== 'RCAREA_INVALID')
  if (areas.length === 0) fail(FILES.miscEnums, 'no RCAREA_ rows found')
  if (areas.length !== prefixes.length) {
    fail(FILES.util, `${prefixes.length} prefixes for ${areas.length} areas`)
  }

  return new Map(
    areas.map((area, i) => {
      const prefix = prefixes.at(i)
      if (prefix === undefined) fail(FILES.util, `no prefix for ${area}`)
      return [area, prefix] as const
    }),
  )
}

export function parseAreas(
  utilCpp: string,
  checkObjectsCpp: string,
  miscEnumsH: string,
): AreaPrefix[] {
  const prefixes = prefixesByArea(utilCpp, miscEnumsH)

  const nameBlock = /rcAreaNames\s*=\s*\{([\s\S]*?)\}\s*;/.exec(
    stripComments(checkObjectsCpp),
  )?.[1]
  const names = new Map(
    Array.from(
      (nameBlock ?? '').matchAll(
        /\{\s*(RCAREA_\w+)\s*,\s*"((?:[^"\\]|\\.)*)"/g,
      ),
      (m) => [capture(m, 1), capture(m, 2)] as const,
    ),
  )
  if (names.size === 0) fail(FILES.checkObjects, 'no rcAreaNames rows found')

  return Array.from(prefixes, ([enumName, prefix]) => {
    const area = names.get(enumName)
    if (area === undefined) fail(FILES.checkObjects, `no name for ${enumName}`)
    return { prefix, area }
  })
}

/*
 * A check's type is the object the player finds it in. Ship's own type says
 * what the spot first held, so a chest with a compass in it is RCTYPE_COMPASS.
 */
const OBJECT_TYPES: Partial<Record<string, string>> = {
  Chest: 'Chests',
  Pot: 'Pots',
  Crate: 'Crates',
  NLCrate: 'Crates',
  SmallCrate: 'Crates',
  Rock: 'Rocks',
  Boulder: 'Boulders',
  Tree: 'Trees',
  NLTree: 'Trees',
  Bush: 'Bushes',
  Grass: 'Grass',
  Sign: 'Signs',
  Icicle: 'Icicles',
  RedIce: 'Red Ice',
  WonderItem: 'Wonder Items',
  Fish: 'Fish',
  GrottoFish: 'Fish',
  GSToken: 'Gold Skulltulas',
  StoneFairy: 'Fairies',
  FountainFairy: 'Fairies',
  BeanFairy: 'Fairies',
  SongFairy: 'Fairies',
  ButterflyFairy: 'Fairies',
}

// For these general-purpose kinds, Ship's own type says what they are
const SHIP_TYPES: Partial<Record<string, Partial<Record<string, string>>>> = {
  Collectable: {
    RCTYPE_STANDARD: 'Freestanding Items',
    RCTYPE_FREESTANDING: 'Freestanding Items',
    RCTYPE_SMALL_KEY: 'Freestanding Items',
    RCTYPE_GF_KEY: 'Freestanding Items',
    RCTYPE_SILVER: 'Silver Rupees',
  },
  Base: {
    RCTYPE_STANDARD: 'Gifts and Rewards',
    RCTYPE_OCARINA: 'Gifts and Rewards',
    RCTYPE_LINKS_POCKET: 'Gifts and Rewards',
    RCTYPE_CHEST_GAME: 'Gifts and Rewards',
    RCTYPE_DUNGEON_REWARD: 'Boss Rewards',
    RCTYPE_BOSS_HEART_OR_OTHER_REWARD: 'Boss Rewards',
    RCTYPE_SONG_LOCATION: 'Songs',
    RCTYPE_SHOP: 'Shops',
    RCTYPE_SCRUB: 'Scrubs',
    RCTYPE_MERCHANT: 'Merchants',
    RCTYPE_BEEHIVE: 'Beehives',
    RCTYPE_COW: 'Cows',
    RCTYPE_ADULT_TRADE: 'Adult Trade',
    RCTYPE_FROG_SONG: 'Frogs',
    RCTYPE_BEGGAR: 'Beggar',
  },
}

// Hint locations never appear in a log's locations
const NOT_CHECKS = new Set(['HintStone', 'OtherHint'])

function scenesByArea(locationCpp: string): Map<string, string> {
  const body =
    /GetAreaFromScene\(uint8_t scene\)\s*\{([\s\S]*?)\n\}/.exec(
      stripComments(locationCpp),
    )?.[1] ?? ''
  const areas = new Map<string, string>()
  let scenes: string[] = []
  for (const m of body.matchAll(/case (SCENE_\w+):|return (RCAREA_\w+);/g)) {
    const scene = m.at(1)
    if (scene !== undefined) {
      scenes.push(scene)
      continue
    }
    for (const waiting of scenes) areas.set(waiting, capture(m, 2))
    scenes = []
  }
  if (areas.size === 0) fail(FILES.location, 'no GetAreaFromScene rows found')
  return areas
}

function checkType(rc: string, kind: string, args: string): string {
  const shipType = /\bRCTYPE_\w+/.exec(args)?.[0] ?? ''
  const type = OBJECT_TYPES[kind] ?? SHIP_TYPES[kind]?.[shipType]
  if (type === undefined) {
    fail(FILES.locationList, `no type for ${rc}: ${kind} ${shipType}`)
  }
  return type
}

function checkName(
  rc: string,
  args: string,
  areaOfScene: Map<string, string>,
  prefixes: Map<string, string>,
): string {
  const hintKey = args.indexOf('RHT_')
  const names = strings(hintKey === -1 ? args : args.slice(0, hintKey))
  const shortName = names.at(0)
  const spoilerName = names.at(1)
  if (shortName === undefined) fail(FILES.locationList, `no name for ${rc}`)
  if (spoilerName !== undefined) return spoilerName

  const scene = /\bSCENE_\w+/.exec(args)?.[0] ?? ''
  const area = /\bRCAREA_\w+/.exec(args)?.[0] ?? areaOfScene.get(scene)
  const prefix = area === undefined ? undefined : prefixes.get(area)
  if (prefix === undefined) fail(FILES.location, `no area for ${rc}`)
  return `${prefix} ${shortName}`
}

export function parseCheckTypes(
  utilCpp: string,
  miscEnumsH: string,
  locationCpp: string,
  locationTables: string[],
): Record<string, string> {
  const prefixes = prefixesByArea(utilCpp, miscEnumsH)
  const areaOfScene = scenesByArea(locationCpp)

  const types = new Map<string, string>()
  for (const table of locationTables) {
    const text = stripComments(table)
    for (const m of text.matchAll(
      /locationTable\[(RC_\w+)\]\s*=\s*Location::(\w+)\(/g,
    )) {
      const rc = capture(m, 1)
      const kind = capture(m, 2)
      if (rc === 'RC_UNKNOWN_CHECK' || NOT_CHECKS.has(kind)) continue
      const args = argumentsFrom(text, m.index + m[0].length)
      const name = checkName(rc, args, areaOfScene, prefixes)
      const type = checkType(rc, kind, args)
      // Vanilla and Master Quest can share a name
      const other = types.get(name)
      if (other !== undefined && other !== type) {
        fail(FILES.locationList, `${name} is both ${other} and ${type}`)
      }
      types.set(name, type)
    }
  }
  if (types.size === 0) fail(FILES.locationList, 'no locationTable rows found')

  return Object.fromEntries(
    [...types].sort(([a], [b]) => {
      if (a < b) return -1
      return a > b ? 1 : 0
    }),
  )
}

// Named as the check areas are, so one place has one name
const ENTRANCE_GROUP_NAMES: Partial<Record<string, string>> = {
  SFM: 'Sacred Forest Meadow',
  KAKARIKO: 'Kakariko Village',
  MARKET: 'Hyrule Market',
  ZORAS_DOMAIN: "Zora's Domain",
  ZORAS_RIVER: "Zora's River",
  ZORAS_FOUNTAIN: "Zora's Fountain",
}

// SCENE_INFO and SCENE_NO_SPAWN are macros that wrap scene names
const SCENE_NAME = /\bSCENE_(?!INFO\b|NO_SPAWN\b)\w+/g

export function parseEntrances(
  entranceTableH: string,
  trackerCpp: string,
  miscEnumsH: string,
  randomizerTypesH: string,
): Record<string, EntranceEntry> {
  const enumIndex = new Map<string, number>()
  const tableScene = new Map<string, string>()
  for (const m of stripComments(entranceTableH).matchAll(
    /DEFINE_ENTRANCE\(\s*(ENTR_\w+)\s*,\s*(\w+)/g,
  )) {
    enumIndex.set(capture(m, 1), enumIndex.size)
    tableScene.set(capture(m, 1), capture(m, 2))
  }
  if (enumIndex.size === 0)
    fail(FILES.entranceTable, 'no DEFINE_ENTRANCE rows found')

  const grottoOffset = new Map(
    enumItems(miscEnumsH, 'GrottoEntranceOffsets', FILES.miscEnums).map(
      (name, i) => [name, i] as const,
    ),
  )
  const types = stripComments(randomizerTypesH)
  const start = (kind: 'EXIT' | 'LOAD'): number => {
    const value = new RegExp(
      String.raw`#define\s+ENTRANCE_GROTTO_${kind}_START\s+(\w+)`,
    ).exec(types)?.[1]
    if (value === undefined || Number.isNaN(Number(value))) {
      fail(FILES.types, `no ENTRANCE_GROTTO_${kind}_START value found`)
    }
    return Number(value)
  }
  const grottoStart = { LOAD: start('LOAD'), EXIT: start('EXIT') }

  const resolve = (expression: string): number => {
    const grotto = /^ENTRANCE_GROTTO_(LOAD|EXIT)\((\w+)\)$/.exec(expression)
    if (grotto) {
      const offset = grottoOffset.get(capture(grotto, 2))
      if (offset === undefined)
        fail(FILES.miscEnums, `no offset for ${capture(grotto, 2)}`)
      return grottoStart[capture(grotto, 1) as 'EXIT' | 'LOAD'] + offset
    }
    const index = enumIndex.get(expression)
    if (index === undefined)
      fail(FILES.entranceTable, `no entrance ${expression}`)
    return index
  }

  const block = /entranceData\s*\[\s*\]\s*=\s*\{([\s\S]*?)\n\}\s*;/.exec(
    stripComments(trackerCpp),
  )?.[1]
  const starts = Array.from(
    (block ?? '').matchAll(
      /\{\s*(ENTR_\w+|ENTRANCE_GROTTO_(?:LOAD|EXIT)\(\w+\))\s*,/g,
    ),
  )
  if (block === undefined || starts.length === 0) {
    fail(FILES.tracker, 'no entranceData rows found')
  }

  const result: Record<string, EntranceEntry> = {}
  starts.forEach((m, i) => {
    const row = block.slice(m.index, starts[i + 1]?.index ?? block.length)
    const found = strings(row)
    const source = found.at(0)
    const destination = found.at(1)
    const group = /ENTRANCE_GROUP_(\w+)/.exec(row)?.[1]
    const type = /ENTRANCE_TYPE_(\w+)/.exec(row)?.[1]
    if (
      source === undefined ||
      destination === undefined ||
      group === undefined ||
      type === undefined
    ) {
      fail(FILES.tracker, `incomplete row for ${capture(m, 1)}`)
    }
    const landingScene = tableScene.get(capture(m, 1))
    result[String(resolve(capture(m, 1)))] = {
      source,
      destination,
      group: ENTRANCE_GROUP_NAMES[group] ?? titleCase(group),
      type: titleCase(type),
      // A row can name a scene once per spawn
      scenes: [
        ...new Set(row.slice(0, row.indexOf('"')).match(SCENE_NAME) ?? []),
      ],
      landingScene,
    }
  })
  return result
}

// Textures are category-first (MaskZora); players say Zora Mask
const TRAILING_CATEGORIES = new Set([
  'Arrow',
  'Boots',
  'Bottle',
  'Medallion',
  'Mask',
  'Ocarina',
  'Scale',
  'Shield',
  'Sword',
  'Tunic',
])

const ICON_NAMES: Partial<Record<string, string>> = {
  OcarinaOfTime: 'Ocarina of Time',
  MaskBunnyHood: 'Bunny Hood',
  MaskTruth: 'Mask of Truth',
  BottlePotionRed: 'Red Potion Bottle',
  BottlePotionGreen: 'Green Potion Bottle',
  BottlePotionBlue: 'Blue Potion Bottle',
  BottleMilkFull: 'Full Milk Bottle',
  BottleMilkHalf: 'Half Milk Bottle',
  BottleRutosLetter: 'Ruto’s Letter',
  DinsFire: 'Din’s Fire',
  FaroresWind: 'Farore’s Wind',
  NayrusLove: 'Nayru’s Love',
  LensOfTruth: 'Lens of Truth',
  StoneOfAgony: 'Stone of Agony',
  ZeldasLetter: 'Zelda’s Letter',
  PoachersSaw: 'Poacher’s Saw',
  BrokenGoronsSword: 'Broken Goron’s Sword',
  BrokenGiantsKnife: 'Broken Giant’s Knife',
  GoronsBracelet: 'Goron’s Bracelet',
  AdultsWallet: 'Adult Wallet',
  GiantsWallet: 'Giant Wallet',
  GerudosCard: 'Gerudo Card',
  MagicJarSmall: 'Small Magic Jar',
  MagicJarBig: 'Big Magic Jar',
}

function iconName(texture: string): string {
  const override = ICON_NAMES[texture]
  if (override !== undefined) return override
  const words = texture
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .split(' ')
  const first = words.at(0)
  return first !== undefined &&
    words.length > 1 &&
    TRAILING_CATEGORIES.has(first)
    ? [...words.slice(1), first].join(' ')
    : words.join(' ')
}

export function parseHashIcons(randoHashH: string): string[] {
  const icons = Array.from(
    stripComments(randoHashH).matchAll(/dg(?:Item|Quest)Icon(\w+?)Tex\b/g),
    (m) => iconName(capture(m, 1)),
  )
  if (icons.length === 0) fail(FILES.hash, 'no icon textures found')
  return icons
}
