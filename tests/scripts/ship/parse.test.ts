import {
  parseAreas,
  parseCheckTypes,
  parseEntrances,
  parseHashIcons,
} from '../../../scripts/ship/parse'

// Trimmed from soh/soh/util.cpp.
const UTIL = `
std::array<std::string, RA_MAX> rcareaPrefixes = {
    "KF",
    "LW",
    "SFM",
    "Deku Tree",
    "Dodongos Cavern",
    "Ganon's Castle",
};

const std::string& SohUtils::GetSceneName(int32_t scene) {
    return sceneNames[scene];
}
`

// Trimmed from soh/soh/Enhancements/randomizer/randomizer_check_objects.cpp.
const CHECK_OBJECTS = `
std::map<RandomizerCheckArea, std::string> rcAreaNames = {
    { RCAREA_KOKIRI_FOREST, "Kokiri Forest" },
    { RCAREA_LOST_WOODS, "Lost Woods" },
    { RCAREA_SACRED_FOREST_MEADOW, "Sacred Forest Meadow" },
    { RCAREA_DEKU_TREE, "Deku Tree" },
    { RCAREA_DODONGOS_CAVERN, "Dodongo's Cavern" },
    { RCAREA_GANONS_CASTLE, "Ganon's Castle" },
    { RCAREA_INVALID, "Invalid" },
};
`

/*
 * Trimmed from soh/soh/Enhancements/randomizer/randomizerEnums/RandomizerMiscEnums.h.
 * Area names are listed out of order on purpose: pairing is by enum order.
 */
const MISC_ENUMS = `
RANDO_ENUM_BEGIN(RandomizerCheckQuest)
RANDO_ENUM_ITEM(RCQUEST_VANILLA)
RANDO_ENUM_END(RandomizerCheckQuest)

RANDO_ENUM_BEGIN(RandomizerCheckArea)
RANDO_ENUM_ITEM(RCAREA_KOKIRI_FOREST)
RANDO_ENUM_ITEM(RCAREA_LOST_WOODS)
RANDO_ENUM_ITEM(RCAREA_SACRED_FOREST_MEADOW)
RANDO_ENUM_ITEM(RCAREA_DEKU_TREE)
RANDO_ENUM_ITEM(RCAREA_DODONGOS_CAVERN)
RANDO_ENUM_ITEM(RCAREA_GANONS_CASTLE)
// If adding any more RANDO_ENUM_ITEM(areas) Check Tracker will need a refactor
RANDO_ENUM_ITEM(RCAREA_INVALID)
RANDO_ENUM_END(RandomizerCheckArea)

RANDO_ENUM_BEGIN(GrottoEntranceOffsets)
/* 0x00 */ RANDO_ENUM_ITEM(GROTTO_COLOSSUS_OFFSET)
/* 0x01 */ RANDO_ENUM_ITEM(GROTTO_LH_OFFSET)
/* 0x02 */ RANDO_ENUM_ITEM(GROTTO_OFFSET_MAX)
RANDO_ENUM_END(GrottoEntranceOffsets)
`

/*
 * Trimmed from soh/include/tables/entrance_table.h. The block comment holds a
 * DEFINE_ENTRANCE( that must not be counted.
 */
const TABLE = `
/**
 * DEFINE_ENTRANCE should be used for entrances
 *    - Argument 1: Enum value for this entrance
 */
/* 0x000 */ DEFINE_ENTRANCE(ENTR_LINKS_HOUSE_CHILD_SPAWN, SCENE_LINKS_HOUSE, 0, false, true, TRANS_TYPE_FADE_BLACK, TRANS_TYPE_FADE_BLACK)
/* 0x001 */ DEFINE_ENTRANCE(ENTR_HYRULE_FIELD_10, SCENE_HYRULE_FIELD, 10, false, true, TRANS_TYPE_FADE_BLACK, TRANS_TYPE_FADE_BLACK)

/* 0x002 */ DEFINE_ENTRANCE(ENTR_KOKIRI_FOREST_LOWER_EXIT, SCENE_KOKIRI_FOREST, 0, false, true, TRANS_TYPE_FADE_BLACK, TRANS_TYPE_FADE_BLACK)
/* 0x003 */ DEFINE_ENTRANCE(ENTR_SACRED_FOREST_MEADOW_WARP_PAD, SCENE_SACRED_FOREST_MEADOW, 6, false, true, TRANS_TYPE_FADE_BLACK, TRANS_TYPE_FADE_BLACK)
`

// Trimmed from soh/soh/Enhancements/randomizer/randomizer_entrance_tracker.cpp.
const TRACKER = `
const EntranceData entranceData[] = {
    // clang-format off
    //index,                reverse, scenes (and spawns),     source name,   destination name, source group,           destination group,      type,                 metaTag, oneExit
    { ENTR_LINKS_HOUSE_CHILD_SPAWN,   -1,      SINGLE_SCENE_INFO(SCENE_LINKS_HOUSE), "Child Spawn", "Link's House",   ENTRANCE_GROUP_ONE_WAY, ENTRANCE_GROUP_ONE_WAY, ENTRANCE_TYPE_ONE_WAY},
    { ENTR_HYRULE_FIELD_10, -1,      SINGLE_SCENE_INFO(SCENE_TEMPLE_OF_TIME), "Adult Spawn", "Temple of Time", ENTRANCE_GROUP_ONE_WAY, ENTRANCE_GROUP_ONE_WAY, ENTRANCE_TYPE_ONE_WAY},

    { ENTR_SACRED_FOREST_MEADOW_WARP_PAD,  -1, {{ -1 }}, "Minuet of Forest",   "SFM Warp Pad",              ENTRANCE_GROUP_ONE_WAY, ENTRANCE_GROUP_ONE_WAY, ENTRANCE_TYPE_ONE_WAY},

    // Kokiri Forest
    { ENTR_KOKIRI_FOREST_LOWER_EXIT,              ENTR_LOST_WOODS_BRIDGE_EAST_EXIT,                 SINGLE_SCENE_INFO(SCENE_KOKIRI_FOREST),          "Kokiri Forest Lower Exit",     "Lost Woods Bridge East Exit", ENTRANCE_GROUP_KOKIRI_FOREST, ENTRANCE_GROUP_LOST_WOODS,    ENTRANCE_TYPE_OVERWORLD, "lw"},
    { ENTRANCE_GROTTO_LOAD(GROTTO_LH_OFFSET), ENTRANCE_GROTTO_EXIT(GROTTO_LH_OFFSET), SINGLE_SCENE_INFO(SCENE_LAKE_HYLIA),          "LH Grave Grotto Entry",       "LH Grave Grotto",            ENTRANCE_GROUP_LAKE_HYLIA, ENTRANCE_GROUP_SFM, ENTRANCE_TYPE_GROTTO,    "chest", 1},
    { ENTRANCE_GROTTO_EXIT(GROTTO_LH_OFFSET), ENTRANCE_GROTTO_LOAD(GROTTO_LH_OFFSET), {{ SCENE_GROTTOS, 0x00 }},                       "LH Grave Grotto",             "LH Grave Grotto Entry",      ENTRANCE_GROUP_LAKE_HYLIA, ENTRANCE_GROUP_LAKE_HYLIA, ENTRANCE_TYPE_GROTTO,    "chest"},
};
`

// Trimmed from soh/soh/Enhancements/randomizer/randomizerTypes.h.
const TYPES = `
#define ENTRANCE_GROTTO_LOAD_START 0x0700
#define ENTRANCE_GROTTO_EXIT_START 0x0800

#define ENTRANCE_GROTTO_LOAD(index) ENTRANCE_GROTTO_LOAD_START + index
#define ENTRANCE_GROTTO_EXIT(index) ENTRANCE_GROTTO_EXIT_START + index
`

// Trimmed from soh/soh/Enhancements/randomizer/rando_hash.h.
const HASH = `
inline std::array<Sprite, 100> gSeedTextures = { {
    { dgItemIconDekuNutTex, 32, 32, G_IM_FMT_RGBA, G_IM_SIZ_32b, 0 },
    { dgQuestIconSmallKeyTex, 24, 24, G_IM_FMT_RGBA, G_IM_SIZ_32b, 97 },
} };
`

// Trimmed from soh/soh/Enhancements/randomizer/location.cpp.
const LOCATION = `
RandomizerCheckArea GetAreaFromScene(uint8_t scene) {
    switch (scene) {
        case SCENE_LINKS_HOUSE:
        case SCENE_KOKIRI_FOREST:
            return RCAREA_KOKIRI_FOREST;

        case SCENE_SACRED_FOREST_MEADOW:
            return RCAREA_SACRED_FOREST_MEADOW;

        case SCENE_DEKU_TREE:
            return RCAREA_DEKU_TREE;
        default:
            assert(false);
            return RCAREA_INVALID;
    }
}
`

// Trimmed from the randomizer's location_list.cpp and Shuffle*.cpp files.
const LOCATION_TABLE = `
    locationTable[RC_UNKNOWN_CHECK] = Location::Base(RC_UNKNOWN_CHECK, RCQUEST_BOTH, RCTYPE_STANDARD, RCAREA_INVALID, ACTOR_ID_MAX, SCENE_ID_MAX, 0x00, "Invalid Location", RHT_NONE, RG_NONE);
    // locationTable[RC_KF_OLD_CHEST] = Location::Chest(RC_KF_OLD_CHEST, RCQUEST_BOTH, RCTYPE_STANDARD, ACTOR_EN_BOX, SCENE_KOKIRI_FOREST, 1, 0x00, "Old Chest", RHT_NONE, RG_NONE, true);
    locationTable[RC_KF_KOKIRI_SWORD_CHEST] = Location::Chest(RC_KF_KOKIRI_SWORD_CHEST, RCQUEST_BOTH, RCTYPE_STANDARD, ACTOR_EN_BOX, SCENE_KOKIRI_FOREST, 1248, 0x00, "Kokiri Sword Chest", RHT_KF_KOKIRI_SWORD_CHEST, RG_KOKIRI_SWORD, true);
    locationTable[RC_DEKU_TREE_MAP_CHEST] = Location::Chest(RC_DEKU_TREE_MAP_CHEST, RCQUEST_VANILLA, RCTYPE_MAP, ACTOR_EN_BOX, SCENE_DEKU_TREE, 2083, 0x03, "Map Chest", RHT_DEKU_TREE_MAP_CHEST, RG_DEKU_TREE_MAP, true);
    locationTable[RC_KF_LINKS_HOUSE_COW] = Location::Base(RC_KF_LINKS_HOUSE_COW, RCQUEST_BOTH, RCTYPE_COW, ACTOR_EN_COW, SCENE_LINKS_HOUSE, 0x00, "Links House Cow", RHT_KF_LINKS_HOUSE_COW, RG_MILK);
    locationTable[RC_SHEIK_IN_FOREST] = Location::Base(RC_SHEIK_IN_FOREST, RCQUEST_BOTH, RCTYPE_SONG_LOCATION, ACTOR_ID_MAX, SCENE_SACRED_FOREST_MEADOW, 0x00, "Sheik in Forest", "Sheik in Forest", RHT_SHEIK_IN_FOREST, RG_MINUET_OF_FOREST);
    locationTable[RC_KF_BRIDGE_RUPEE] = Location::Collectable(RC_KF_BRIDGE_RUPEE, RCQUEST_BOTH, RCTYPE_FREESTANDING, ACTOR_EN_ITEM00, SCENE_KOKIRI_FOREST, 0x4006, "Bridge Rupee", RHT_KF_BRIDGE_RUPEE, RG_BLUE_RUPEE);
    locationTable[RC_KF_LINKS_HOUSE_POT] = Location::Pot(RC_KF_LINKS_HOUSE_POT, RCQUEST_BOTH, RCAREA_KOKIRI_FOREST, SCENE_LINKS_HOUSE, TWO_ACTOR_PARAMS(-118, 51), "Links House Pot", RHT_POT_KOKIRI_FOREST, RG_RECOVERY_HEART, SpoilerCollectionCheck::RandomizerInf(RAND_INF_POT_1));
    locationTable[RC_KF_BOX_CRATE] = Location::SmallCrate(RC_KF_BOX_CRATE, RCQUEST_BOTH, RCAREA_KOKIRI_FOREST, SCENE_KOKIRI_FOREST, TWO_ACTOR_PARAMS(1, 2), "Box Crate", RHT_CRATE_KOKIRI_FOREST, RG_GREEN_RUPEE);
    locationTable[RC_KF_GOSSIP_STONE] = Location::HintStone(RC_KF_GOSSIP_STONE, RCQUEST_BOTH, SCENE_KOKIRI_FOREST, 1, "Gossip Stone");
`

const checkTypes = (...tables: string[]) =>
  parseCheckTypes(UTIL, MISC_ENUMS, LOCATION, tables)

const entrances = () => parseEntrances(TABLE, TRACKER, MISC_ENUMS, TYPES)

it('pairs area prefixes with area names by enum order', () => {
  const areas = parseAreas(UTIL, CHECK_OBJECTS, MISC_ENUMS)
  expect(areas).toContainEqual({ prefix: 'KF', area: 'Kokiri Forest' })
  expect(areas).toContainEqual({ prefix: 'SFM', area: 'Sacred Forest Meadow' })
  expect(areas).toContainEqual({
    prefix: 'Dodongos Cavern',
    area: "Dodongo's Cavern",
  })
  expect(areas).toHaveLength(6)
})

it('numbers entrances by table position, ignoring block comments', () => {
  expect(entrances()['1']!.source).toBe('Adult Spawn')
})

it('resolves grotto macros from their start values', () => {
  // ENTRANCE_GROTTO_LOAD_START 0x0700, ENTRANCE_GROTTO_EXIT_START 0x0800
  expect(entrances()[String(0x0700 + 1)]!.source).toBe('LH Grave Grotto Entry')
  expect(entrances()[String(0x0800 + 1)]!.destination).toBe(
    'LH Grave Grotto Entry',
  )
})

it('humanizes entrance groups and types', () => {
  expect(entrances()['1']).toMatchObject({
    group: 'One Way',
    type: 'One Way',
  })
  expect(entrances()['2']).toMatchObject({
    group: 'Kokiri Forest',
    type: 'Overworld',
  })
})

it('records the scene a door is in', () => {
  expect(entrances()['2']!.scenes).toEqual(['SCENE_KOKIRI_FOREST'])
  expect(entrances()[String(0x0800 + 1)]!.scenes).toEqual(['SCENE_GROTTOS'])
})

it('records every scene of a row, without the macro names', () => {
  const tracker = TRACKER.replace(
    'SINGLE_SCENE_INFO(SCENE_KOKIRI_FOREST)',
    '{SCENE_NO_SPAWN(SCENE_MARKET_DAY), SCENE_NO_SPAWN(SCENE_MARKET_NIGHT)}',
  )
  expect(
    parseEntrances(TABLE, tracker, MISC_ENUMS, TYPES)['2']!.scenes,
  ).toEqual(['SCENE_MARKET_DAY', 'SCENE_MARKET_NIGHT'])
})

it('records no scene for a warp song', () => {
  expect(entrances()['3']!.scenes).toEqual([])
})

it('records the scene an entrance table row lands in', () => {
  expect(entrances()['3']!.landingScene).toBe('SCENE_SACRED_FOREST_MEADOW')
  expect(entrances()[String(0x0700 + 1)]?.landingScene).toBeUndefined()
})

it('writes Sacred Forest Meadow out in full', () => {
  expect(entrances()[String(0x0700 + 1)]).toMatchObject({
    group: 'Lake Hylia',
    type: 'Grotto',
  })
  expect(
    parseEntrances(
      TABLE,
      TRACKER.replace(
        'ENTRANCE_GROUP_LAKE_HYLIA, ENTRANCE_GROUP_SFM',
        'ENTRANCE_GROUP_SFM, ENTRANCE_GROUP_SFM',
      ),
      MISC_ENUMS,
      TYPES,
    )[String(0x0700 + 1)]!.group,
  ).toBe('Sacred Forest Meadow')
})

it.each([
  ['KAKARIKO', 'Kakariko Village'],
  ['MARKET', 'Hyrule Market'],
  ['ZORAS_DOMAIN', "Zora's Domain"],
  ['ZORAS_RIVER', "Zora's River"],
  ['ZORAS_FOUNTAIN', "Zora's Fountain"],
])('names the %s entrance group like its check area', (group, name) => {
  expect(
    parseEntrances(
      TABLE,
      TRACKER.replace(
        'ENTRANCE_GROUP_KOKIRI_FOREST, ENTRANCE_GROUP_LOST_WOODS',
        `ENTRANCE_GROUP_${group}, ENTRANCE_GROUP_LOST_WOODS`,
      ),
      MISC_ENUMS,
      TYPES,
    )['2']!.group,
  ).toBe(name)
})

it('types checks by the object the player finds them in', () => {
  expect(checkTypes(LOCATION_TABLE)).toMatchObject({
    'KF Kokiri Sword Chest': 'Chests',
    'Deku Tree Map Chest': 'Chests',
    'KF Links House Pot': 'Pots',
    'KF Box Crate': 'Crates',
  })
})

it('types checks with no object by what Ship calls them', () => {
  expect(checkTypes(LOCATION_TABLE)).toMatchObject({
    'KF Links House Cow': 'Cows',
    'KF Bridge Rupee': 'Freestanding Items',
    'Sheik in Forest': 'Songs',
  })
})

it('leaves out hint stones, commented rows and the invalid check', () => {
  const names = Object.keys(checkTypes(LOCATION_TABLE))
  expect(names).toHaveLength(7)
  expect(names).not.toContain('KF Gossip Stone')
  expect(names).not.toContain('KF Old Chest')
  expect(names).not.toContain('Invalid Location')
})

it('reads checks from every source file, sorted by name', () => {
  const pot = LOCATION_TABLE.split('\n').find((line) =>
    line.includes('Location::Pot'),
  )!
  const cow = LOCATION_TABLE.split('\n').find((line) =>
    line.includes('RCTYPE_COW'),
  )!
  expect(Object.keys(checkTypes(pot, cow))).toEqual([
    'KF Links House Cow',
    'KF Links House Pot',
  ])
})

it.each([
  [
    'an object it has no name for',
    'Location::Pot',
    'Location::Lantern',
    'no type for RC_KF_LINKS_HOUSE_POT',
  ],
  [
    'a type it has no name for',
    'RCTYPE_COW',
    'RCTYPE_LLAMA',
    'no type for RC_KF_LINKS_HOUSE_COW',
  ],
  [
    'a scene with no area',
    'SCENE_LINKS_HOUSE, 0x00',
    'SCENE_MOON, 0x00',
    'no area for RC_KF_LINKS_HOUSE_COW',
  ],
])('throws on %s', (_what, from, to, message) => {
  expect(() => checkTypes(LOCATION_TABLE.replace(from, to))).toThrow(message)
})

it('throws when one name has two types', () => {
  const chest = `locationTable[RC_A] = Location::Chest(RC_A, RCQUEST_VANILLA, RCTYPE_STANDARD, ACTOR_EN_BOX, SCENE_KOKIRI_FOREST, 1, 0x00, "Twin", RHT_NONE, RG_NONE, true);`
  const pot = `locationTable[RC_B] = Location::Pot(RC_B, RCQUEST_MQ, RCAREA_KOKIRI_FOREST, SCENE_KOKIRI_FOREST, 1, "Twin", RHT_NONE, RG_NONE);`
  expect(() => checkTypes(chest, pot)).toThrow('KF Twin')
})

it('accepts the same name twice with the same type', () => {
  const pot = (rc: string, quest: string) =>
    `locationTable[${rc}] = Location::Pot(${rc}, ${quest}, RCAREA_KOKIRI_FOREST, SCENE_KOKIRI_FOREST, 1, "Twin", RHT_NONE, RG_NONE);`
  expect(
    checkTypes(pot('RC_A', 'RCQUEST_VANILLA'), pot('RC_B', 'RCQUEST_MQ')),
  ).toEqual({ 'KF Twin': 'Pots' })
})

it('turns icon texture names into item names', () => {
  expect(parseHashIcons(HASH)).toEqual(['Deku Nut', 'Small Key'])
})

it('throws naming the file when a parser finds no rows', () => {
  expect(() => parseAreas('', CHECK_OBJECTS, MISC_ENUMS)).toThrow('util.cpp')
  expect(() => parseEntrances('', TRACKER, MISC_ENUMS, TYPES)).toThrow(
    'entrance_table.h',
  )
  expect(() => parseEntrances(TABLE, '', MISC_ENUMS, TYPES)).toThrow(
    'randomizer_entrance_tracker.cpp',
  )
  expect(() => parseHashIcons('')).toThrow('rando_hash.h')
  expect(() => parseCheckTypes(UTIL, MISC_ENUMS, '', [LOCATION_TABLE])).toThrow(
    'location.cpp',
  )
  expect(() => parseCheckTypes(UTIL, MISC_ENUMS, LOCATION, [''])).toThrow(
    'location_list.cpp',
  )
})

it('separates sizes in icon names with spaces', () => {
  expect(
    parseHashIcons('{ dgItemIconBulletBag30Tex, 32, 32, G_IM_FMT_RGBA }'),
  ).toEqual(['Bullet Bag 30'])
})

it('puts the category last, as the game names its items', () => {
  const textures = [
    'MaskZora',
    'BottlePoe',
    'ShieldMirror',
    'MedallionWater',
    'ArrowFire',
    'OcarinaFairy',
    'BottleBlueFire',
  ]
  const source = textures
    .map((t) => `{ dgItemIcon${t}Tex, 32, 32, G_IM_FMT_RGBA }`)
    .join('\n')
  expect(parseHashIcons(source)).toEqual([
    'Zora Mask',
    'Poe Bottle',
    'Mirror Shield',
    'Water Medallion',
    'Fire Arrow',
    'Fairy Ocarina',
    'Blue Fire Bottle',
  ])
})

it('names irregular items explicitly', () => {
  const textures = ['OcarinaOfTime', 'MaskTruth', 'DinsFire', 'BottlePotionRed']
  const source = textures
    .map((t) => `{ dgItemIcon${t}Tex, 32, 32, G_IM_FMT_RGBA }`)
    .join('\n')
  expect(parseHashIcons(source)).toEqual([
    'Ocarina of Time',
    'Mask of Truth',
    'Din’s Fire',
    'Red Potion Bottle',
  ])
})
