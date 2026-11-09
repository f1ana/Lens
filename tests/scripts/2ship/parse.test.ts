import {
  type AreaInput,
  checkRows,
  parseChecks,
  parseCheckTypeLabels,
  parseItems,
  parseOptions,
  parseRegions,
  parseScenes,
  readableName,
  type Region,
  resolveAreas,
} from '../../../scripts/2ship/parse'

// Trimmed from mm/2s2h/Rando/StaticData/Checks.cpp.
const CHECKS = `
#define RC(id, type, scene, flagType, flag, item)      \\
    {                                                  \\
        id, {                                          \\
            id, #id, type, scene, flagType, flag, item \\
        }                                              \\
    }

// clang-format off
std::map<RandoCheckId, RandoStaticCheck> Checks = {
    RC(RC_UNKNOWN,                       RCTYPE_UNKNOWN,          SCENE_MAX,                      FLAG_NONE,                   0x00,                                                                RI_UNKNOWN),

    RC(RC_BOMB_SHOP_ITEM_01,             RCTYPE_SHOP,             SCENE_BOMYA,                    FLAG_NONE,                   0x00,                                                                RI_BOMBS_10),
};
`

// Trimmed from mm/2s2h/Rando/StaticData/Items.cpp.
const ITEMS = `
#define RI(id, article, name, type, itemId, getItemId, drawId)      \\
    {                                                               \\
        id, {                                                       \\
            id, #id, article, name, type, itemId, getItemId, drawId \\
        }                                                           \\
    }

// clang-format off
std::map<RandoItemId, RandoStaticItem> Items = {
    RI(RI_UNKNOWN,                    "",     "Unknown",                    RITYPE_JUNK,            ITEM_NONE,                       GI_NONE,                     GID_NONE),
    RI(RI_ARROW_FIRE,                 "",     "Fire Arrows",                RITYPE_MAJOR,           ITEM_ARROW_FIRE,                 GI_ARROW_FIRE,               GID_ARROW_FIRE),
    RI(RI_JUNK,                       "",     "Junk",                       RITYPE_JUNK,            ITEM_NONE,                       GI_NONE,                     GID_NONE),
    RI(RI_NONE,                       "",     "literally nothing",          RITYPE_JUNK,            ITEM_NONE,                       GI_NONE,                     GID_NONE),
    RI(RI_TRAP,                       "a",    "Knockoff Item",              RITYPE_LESSER,          ITEM_NONE,                       GI_NONE,                     GID_NONE),
};
`

// Trimmed from mm/2s2h/Rando/StaticData/Options.cpp.
const OPTIONS = `
#define RO(id, defaultValue)                             \\
    {                                                    \\
        id, {                                            \\
            id, #id, "gRando.Options." #id, defaultValue \\
        }                                                \\
    }

// clang-format off
std::map<RandoOptionId, RandoStaticOption> Options = {
    RO(RO_CLOCK_TERMINAL_TIME,         350), // Default: 05:50 (10 "minutes" before crash)
    RO(RO_HINTS_BANK_SIGN,             RO_GENERIC_OFF),
    RO(RO_LOGIC,                       RO_LOGIC_GLITCHLESS),
    RO(RO_SHUFFLE_POT_DROPS,           RO_GENERIC_OFF),
    RO(RO_SHUFFLE_SWIM,                RO_GENERIC_OFF),
    RO(RO_STARTING_HEALTH,             3),
    RO(RO_TRAP_AMOUNT,                 5),
};
`

// Trimmed from mm/2s2h/Rando/Menu.cpp.
const MENU = `
std::unordered_map<int32_t, const char*> logicOptions = {
    { RO_LOGIC_GLITCHLESS, "Glitchless" },
    { RO_LOGIC_NO_LOGIC, "No Logic" },
    { RO_LOGIC_NEARLY_NO_LOGIC, "Nearly No Logic" },
    { RO_LOGIC_VANILLA, "Vanilla" },
};

std::unordered_map<int32_t, const char*> junkItemsOptions = {
    { 0, "Default (Cycle)" },
    { 1, "Static" },
};

static std::map<RandoCheckType, const char*> checkTypeNames = {
    { RCTYPE_BARREL, "Barrels" },
    { RCTYPE_HEART, "Heart Pieces & Containers" },
    { RCTYPE_SHOP, "Shop Items" },
};

static void DrawLogicConditionsTab() {
    if (UIWidgets::CVarCombobox("Logic", Rando::StaticData::Options[RO_LOGIC].cvar, &logicOptions)) {
        ClearIncompatibleSetting();
    }
    UIWidgets::Tooltip("Glitchless - The items are shuffled in a way that guarantees the seed is beatable.");
}

static const SceneryDropGroup SCENERY_DROP_GROUPS[] = {
    { "Pot Drops", RO_SHUFFLE_POT_DROPS, RCTYPE_POT, "Breaking each pot is a check." },
};

static void DrawItemPoolTab() {
    ItemPoolCheckbox("Swim", RO_SHUFFLE_SWIM,
                     "Shuffles the ability to Swim.",
                     1);
    if (CVarGetInteger(Rando::StaticData::Options[RO_CLOCK_SHUFFLE].cvar, 0)) {
        {
            UIWidgets::CVarSliderInt(
                "Final Hours Start Time", Rando::StaticData::Options[RO_CLOCK_TERMINAL_TIME].cvar,
                UIWidgets::IntSliderOptions()
                    .Min(0)
                    .Max(359)
                    .DefaultValue(350));
        }
    }
    if (CVarGetInteger(Rando::StaticData::Options[RO_SHUFFLE_TRAPS].cvar, 0)) {
        CVarSliderInt("##trapcount", Rando::StaticData::Options[RO_TRAP_AMOUNT].cvar,
                      IntSliderOptions({ { .tooltip = "How many Traps are shuffled into the Item Pool." } })
                          .Min(1));
    }
}

static void DrawStartingItemsTab() {
    CVarSliderInt("Health", Rando::StaticData::Options[RO_STARTING_HEALTH].cvar,
                  IntSliderOptions().Min(1).Max(20));
}

static void DrawHintsTab() {
    CVarCheckbox("Bank Reward", Rando::StaticData::Options[RO_HINTS_BANK_SIGN].cvar,
                 CheckboxOptions({ { .tooltip = "The sign next to the Bank." } }));
}
`

// Trimmed from mm/2s2h/Rando/Types.h.
const TYPES = `
typedef enum {
    RO_GENERIC_OFF,
    RO_GENERIC_ON,
} RandoOptionGenericOffOn;

typedef enum {
    RO_LOGIC_GLITCHLESS,
    RO_LOGIC_NO_LOGIC,
    RO_LOGIC_NEARLY_NO_LOGIC,
    RO_LOGIC_VANILLA,
} RandoOptionLogic;

typedef enum {
    RO_ACCESS_DUNGEONS_FORM_AND_SONG,
    RO_ACCESS_DUNGEONS_FORM_OR_SONG,
    RO_ACCESS_DUNGEONS_FORM_ONLY,
    RO_ACCESS_DUNGEONS_SONG_ONLY,
    RO_ACCESS_DUNGEONS_OPEN,
} RandoOptionAccessDungeons;

typedef enum {
    RO_ACCESS_TRIALS_20_MASKS,
    RO_ACCESS_TRIALS_REMAINS,
    RO_ACCESS_TRIALS_FORMS,
    RO_ACCESS_TRIALS_OPEN,
} RandoOptionAccessTrials;

typedef enum {
    RO_DUNGEON_ITEM_ANYWHERE,
    RO_DUNGEON_ITEM_OWN_DUNGEON,
    RO_DUNGEON_ITEM_START_WITH,
} RandoOptionDungeonItemPlacement;

typedef enum {
    RO_CLOCK_SHUFFLE_RANDOM,
    RO_CLOCK_SHUFFLE_ASCENDING,
    RO_CLOCK_SHUFFLE_DESCENDING,
} RandoClockShuffleOptions;

typedef enum {
    RC_UNKNOWN,

    RC_ANCIENT_CASTLE_OF_IKANA_BOSS,
    RC_BOMB_SHOP_ITEM_01,
    RC_MAX,
} RandoCheckId;

typedef enum {
    RR_DEKU_PALACE,
    RR_TERMINA_FIELD_BEFORE_GREAT_BAY_COAST,
    RR_TERMINA_FIELD_BIO_BABA_GROTTO,
    RR_MAX,
} RandoRegionId;
`

// Trimmed from mm/include/tables/scene_table.h.
const SCENE_TABLE = `
/**
 * Scene Table
 *
 * DEFINE_SCENE should be used for non-empty scenes
 */
// Southern Swamp (Clear)
/* 0x00 */ DEFINE_SCENE(Z2_20SICHITAI2,       SCENE_20SICHITAI2,       0x116, SCENE_DRAW_CFG_MAT_ANIM,             RESTRICTIONS_NONE,                                    PERSISTENT_CYCLE_FLAGS_SET((1 << 10) | (1 << 11), 0, 0, (1 << 30)),                                         SOUTHERN_SWAMP_CLEARED,        31, "Southern Swamp (Clear)")
/* 0x01 */ DEFINE_SCENE_UNSET(SCENE_UNSET_01)
// Lone Peak Shrine & Grottos
/* 0x07 */ DEFINE_SCENE(KAKUSIANA,            SCENE_KAKUSIANA,         0,     SCENE_DRAW_CFG_MAT_ANIM,             RESTRICTIONS_NONE,                                    PERSISTENT_CYCLE_FLAGS_SET(0, 0, 0, (1 << 2) | (1 << 10) | (1 << 11)),                                      GROTTOS,                      101, "Lone Peak Shrine & Grottos")
`

// Trimmed from mm/2s2h/Rando/Logic/Regions/TerminaField.cpp.
const TERMINA_REGIONS = `
using namespace Rando::Logic;

// clang-format off
static RegisterShipInitFunc initFunc([]() {
    Regions[RR_TERMINA_FIELD_BEFORE_GREAT_BAY_COAST] = RandoRegion{ .name = "Before Great Bay Coast", .sceneId = SCENE_00KEIKOKU,
        .exits = { //     TO                                         FROM
            EXIT(ENTRANCE(GREAT_BAY_COAST, 0),              ENTRANCE(TERMINA_FIELD, 2), true),
            EXIT(ENTRANCE(CLOCK_TOWER_ROOFTOP, 0),                   ONE_WAY_EXIT, AFTER(TIME_NIGHT3_AM_12_00)),
        },
        .connections = {
            CONNECTION(RR_TERMINA_FIELD, CAN_PLAY_SONG(EPONA)),
        },
    };
    Regions[RR_TERMINA_FIELD_BIO_BABA_GROTTO] = RandoRegion{ .name = "Termina Field Bio Baba", .sceneId = SCENE_KAKUSIANA,
        .checks = {
            CHECK(RC_TERMINA_FIELD_BIO_BABA_GROTTO, CAN_BE_ZORA && CAN_USE_ABILITY(SWIM)),
            // CHECK(RC_REMOVED, true),
            CHECK(RC_ENEMY_DROP_BIO_DEKU_BABA, CanKillEnemy(ACTOR_BOSS_05)),
        },
        .exits = { //     TO                                         FROM
            EXIT(ENTRANCE(TERMINA_FIELD, 0),                ENTRANCE(GROTTOS, 11), true),
        },
    };
}, {});
// clang-format on
`

// Trimmed from mm/2s2h/Rando/Logic/Regions/South.cpp.
const SOUTH_REGIONS = `
static RegisterShipInitFunc initFunc([]() {
    Regions[RR_DEKU_PALACE] = RandoRegion{ .sceneId = SCENE_22DEKUCITY,
        .checks = {
            CHECK(RC_DEKU_PALACE_PIECE_OF_HEART, CHECK_MAX_HP(3)),
        },
    };
}, {});
`

const SCENES = new Map([
  ['SCENE_00KEIKOKU', { name: 'Termina Field', order: 21 }],
  ['SCENE_11GORONNOSATO', { name: 'Goron Village (winter)', order: 50 }],
  ['SCENE_20SICHITAI', { name: 'Southern Swamp (poison)', order: 30 }],
  ['SCENE_20SICHITAI2', { name: 'Southern Swamp (Clear)', order: 31 }],
  ['SCENE_BACKTOWN', { name: 'North Clock Town', order: 3 }],
  ['SCENE_INSIDETOWER', { name: 'Clock Tower Interior', order: 19 }],
  ['SCENE_KAKUSIANA', { name: 'Lone Peak Shrine & Grottos', order: 101 }],
  ['SCENE_ROMANYMAE', { name: 'Milk Road', order: 22 }],
])

function region(
  id: string,
  scene: string,
  fields: Partial<Region> = {},
): Region {
  return { id, scene, checks: [], exits: [], connections: [], ...fields }
}

function areaInput(
  regions: Region[],
  ...unplaced: AreaInput['checks']
): AreaInput {
  const placed = [...new Set(regions.flatMap((r) => r.checks))].map((id) => ({
    id,
    type: id.includes('ENEMY_DROP') ? 'RCTYPE_ENEMY_DROP' : 'RCTYPE_NPC',
    scene: 'SCENE_MAX',
  }))
  return { regions, scenes: SCENES, checks: [...placed, ...unplaced] }
}

const input = ({ scene, check }: { check: string; scene: string }) =>
  areaInput([region('RR_A', scene, { checks: [check] })])

const TERMINA_FIELD = region('RR_TERMINA_FIELD', 'SCENE_00KEIKOKU', {
  exits: [{ to: 'ENTRANCE(GROTTOS,11)', from: 'ENTRANCE(TERMINA_FIELD,0)' }],
})

const grottoInput = () =>
  areaInput([
    region('RR_GROTTO', 'SCENE_KAKUSIANA', {
      checks: ['RC_GROTTO_CHEST'],
      exits: [
        { to: 'ENTRANCE(TERMINA_FIELD,0)', from: 'ENTRANCE(GROTTOS,11)' },
      ],
    }),
    TERMINA_FIELD,
  ])

const lonePeakInput = () =>
  areaInput([
    region('RR_GORON_VILLAGE', 'SCENE_11GORONNOSATO', {
      exits: [
        {
          to: 'ENTRANCE(GROTTOS,15)',
          from: 'ENTRANCE(GORON_VILLAGE_WINTER,3)',
        },
      ],
    }),
    region('RR_LONE_PEAK_SHRINE', 'SCENE_KAKUSIANA', {
      checks: ['RC_SHRINE'],
      exits: [
        {
          to: 'ENTRANCE(GORON_VILLAGE_WINTER,3)',
          from: 'ENTRANCE(GROTTOS,15)',
        },
      ],
    }),
  ])

// Milk Road is first in the enum, North Clock Town's scene first in the table
const sharedInput = () =>
  areaInput([
    region('RR_MILK_ROAD', 'SCENE_ROMANYMAE', {
      checks: ['RC_KEATON_QUIZ', 'RC_ENEMY_DROP_KEESE'],
    }),
    region('RR_NORTH_CLOCK_TOWN', 'SCENE_BACKTOWN', {
      checks: ['RC_KEATON_QUIZ', 'RC_ENEMY_DROP_KEESE'],
    }),
    region('RR_SOUTHERN_SWAMP', 'SCENE_20SICHITAI', { checks: ['RC_A'] }),
  ])

const startingInput = () =>
  areaInput([], {
    id: 'RC_STARTING_ITEM_DEKU_MASK',
    type: 'RCTYPE_NPC',
    scene: 'SCENE_INSIDETOWER',
  })

const ambiguousInput = () =>
  areaInput([
    region('RR_BAD_GROTTO', 'SCENE_KAKUSIANA', {
      exits: [
        { to: 'ENTRANCE(TERMINA_FIELD,0)', from: 'ENTRANCE(GROTTOS,1)' },
        { to: 'ENTRANCE(MILK_ROAD,0)', from: 'ENTRANCE(GROTTOS,2)' },
      ],
      checks: ['RC_GROTTO_CHEST'],
    }),
    TERMINA_FIELD,
    region('RR_MILK_ROAD', 'SCENE_ROMANYMAE', {
      exits: [{ to: 'ENTRANCE(GROTTOS,2)', from: 'ENTRANCE(MILK_ROAD,0)' }],
    }),
  ])

it('names a check the way the game does', () => {
  expect(readableName('RC_ANCIENT_CASTLE_OF_IKANA_BOSS_POT_01', 'RC_')).toBe(
    'Ancient Castle Of Ikana Boss Pot 01',
  )
  expect(readableName('RC_SOME_HP_CHECK', 'RC_')).toBe('Some HP Check')
})

it('reads checks in file order and skips RC_UNKNOWN', () => {
  expect(parseChecks(CHECKS)).toEqual([
    { id: 'RC_BOMB_SHOP_ITEM_01', type: 'RCTYPE_SHOP', scene: 'SCENE_BOMYA' },
  ])
})

it('renames RI_TRAP and RI_NONE to names Lens can show', () => {
  expect(parseItems(ITEMS)).toMatchObject({
    RI_ARROW_FIRE: 'Fire Arrows',
    RI_JUNK: 'Junk',
    RI_TRAP: 'Trap',
    RI_NONE: 'Nothing',
  })
})

it('reads a label for each type of check', () => {
  expect(parseCheckTypeLabels(MENU)).toEqual({
    RCTYPE_BARREL: 'Barrels',
    RCTYPE_HEART: 'Heart Pieces & Containers',
    RCTYPE_SHOP: 'Shop Items',
  })
})

it('reads a label from each of the three menu forms', () => {
  const options = parseOptions(OPTIONS, MENU, TYPES)
  expect(options.RO_HINTS_BANK_SIGN).toMatchObject({
    label: 'Bank Reward',
    group: 'Hints',
    kind: 'toggle',
  })
  expect(options.RO_SHUFFLE_SWIM).toMatchObject({
    label: 'Swim',
    group: 'Shuffle',
  })
  expect(options.RO_SHUFFLE_POT_DROPS).toMatchObject({
    label: 'Pot Drops',
    group: 'Shuffle',
  })
})

it('resolves choice values through the enum', () => {
  expect(parseOptions(OPTIONS, MENU, TYPES).RO_LOGIC).toMatchObject({
    label: 'Logic',
    kind: 'choice',
    values: {
      0: 'Glitchless',
      1: 'No Logic',
      2: 'Nearly No Logic',
      3: 'Vanilla',
    },
  })
})

it('reads a slider as a number', () => {
  expect(parseOptions(OPTIONS, MENU, TYPES).RO_STARTING_HEALTH).toMatchObject({
    label: 'Health',
    group: 'Starting',
    kind: 'number',
  })
})

it('names the hidden trap slider from its enum', () => {
  expect(parseOptions(OPTIONS, MENU, TYPES).RO_TRAP_AMOUNT?.label).toBe(
    'Trap Amount',
  )
})

it('marks the terminal time as a time', () => {
  expect(
    parseOptions(OPTIONS, MENU, TYPES).RO_CLOCK_TERMINAL_TIME,
  ).toMatchObject({
    label: 'Final Hours Start Time',
    group: 'Time',
    kind: 'time',
  })
})

it('reads each scene with its name and map select index', () => {
  expect([...parseScenes(SCENE_TABLE)]).toEqual([
    ['SCENE_20SICHITAI2', { name: 'Southern Swamp (Clear)', order: 31 }],
    ['SCENE_KAKUSIANA', { name: 'Lone Peak Shrine & Grottos', order: 101 }],
  ])
})

it('reads regions in enum order, whichever file holds them', () => {
  expect(parseRegions([TERMINA_REGIONS, SOUTH_REGIONS], TYPES)).toEqual([
    {
      id: 'RR_DEKU_PALACE',
      scene: 'SCENE_22DEKUCITY',
      checks: ['RC_DEKU_PALACE_PIECE_OF_HEART'],
      exits: [],
      connections: [],
    },
    {
      id: 'RR_TERMINA_FIELD_BEFORE_GREAT_BAY_COAST',
      scene: 'SCENE_00KEIKOKU',
      checks: [],
      exits: [
        {
          to: 'ENTRANCE(GREAT_BAY_COAST,0)',
          from: 'ENTRANCE(TERMINA_FIELD,2)',
        },
        { to: 'ENTRANCE(CLOCK_TOWER_ROOFTOP,0)', from: 'ONE_WAY_EXIT' },
      ],
      connections: ['RR_TERMINA_FIELD'],
    },
    {
      id: 'RR_TERMINA_FIELD_BIO_BABA_GROTTO',
      scene: 'SCENE_KAKUSIANA',
      checks: [
        'RC_TERMINA_FIELD_BIO_BABA_GROTTO',
        'RC_ENEMY_DROP_BIO_DEKU_BABA',
      ],
      exits: [
        { to: 'ENTRANCE(TERMINA_FIELD,0)', from: 'ENTRANCE(GROTTOS,11)' },
      ],
      connections: [],
    },
  ])
})

it('merges scene variants and applies the tracker names', () => {
  const { byCheck } = resolveAreas(
    input({ scene: 'SCENE_20SICHITAI2', check: 'RC_A' }),
  )
  expect(byCheck.get('RC_A')?.areas).toEqual(['Southern Swamp'])
})

it('files a grotto under the area it opens from', () => {
  expect(
    resolveAreas(grottoInput()).byCheck.get('RC_GROTTO_CHEST')?.areas,
  ).toEqual(['Termina Field'])
})

it('files a grotto under the region it connects to', () => {
  const { byCheck } = resolveAreas(
    areaInput([
      region('RR_ROOM', 'SCENE_YADOYA', {
        checks: ['RC_ROOM_CHEST'],
        connections: ['RR_TERMINA_FIELD'],
      }),
      TERMINA_FIELD,
    ]),
  )
  expect(byCheck.get('RC_ROOM_CHEST')?.areas).toEqual(['Termina Field'])
})

it('keeps Lone Peak Shrine as its own area', () => {
  expect(resolveAreas(lonePeakInput()).byCheck.get('RC_SHRINE')?.areas).toEqual(
    ['Lone Peak Shrine'],
  )
})

it('lists a check under every area that holds it', () => {
  expect(
    resolveAreas(sharedInput()).byCheck.get('RC_KEATON_QUIZ')?.areas,
  ).toEqual(['North Clock Town', 'Milk Road'])
})

it('words a hint location as the game does', () => {
  const { byCheck } = resolveAreas(sharedInput())
  expect(byCheck.get('RC_ENEMY_DROP_KEESE')?.hintLocation).toBe(
    'within a formidable foe',
  )
  expect(byCheck.get('RC_A')?.hintLocation).toBe('in Southern Swamp')
})

it('hints at the last region in enum order', () => {
  expect(
    resolveAreas(sharedInput()).byCheck.get('RC_KEATON_QUIZ')?.hintLocation,
  ).toBe('in North Clock Town')
})

it('uses the check table for a check in no region', () => {
  const { byCheck } = resolveAreas(startingInput())
  expect(byCheck.get('RC_STARTING_ITEM_DEKU_MASK')).toEqual({
    areas: ['Clock Tower Interior'],
    hintLocation: 'in an Unknown Location',
  })
})

it('stops when a grotto reaches more than one area', () => {
  expect(() => resolveAreas(ambiguousInput())).toThrow('RR_BAD_GROTTO')
})

it('passes over a grotto with no way out, as the tracker does', () => {
  const { byCheck } = resolveAreas({
    regions: [
      region('RR_GROTTO', 'SCENE_KAKUSIANA', { checks: ['RC_GROTTO_CHEST'] }),
    ],
    scenes: SCENES,
    checks: [
      { id: 'RC_GROTTO_CHEST', type: 'RCTYPE_CHEST', scene: 'SCENE_00KEIKOKU' },
    ],
  })
  expect(byCheck.get('RC_GROTTO_CHEST')).toEqual({
    areas: ['Termina Field'],
    hintLocation: 'in an Unknown Location',
  })
})

it('stops on a scene the table does not have', () => {
  expect(() =>
    resolveAreas(input({ scene: 'SCENE_NEW', check: 'RC_A' })),
  ).toThrow('SCENE_NEW')
})

it('lists the areas in scene table order, once each', () => {
  expect(resolveAreas(sharedInput()).areas).toEqual([
    'North Clock Town',
    'Milk Road',
    'Southern Swamp',
  ])
})

it('builds check rows in enum order with labels and areas', () => {
  const byCheck = new Map([
    ['RC_BOMB_SHOP_ITEM_01', { areas: ['A'], hintLocation: 'in A' }],
    ['RC_ANCIENT_CASTLE_OF_IKANA_BOSS', { areas: ['B'], hintLocation: 'in B' }],
  ])
  expect(
    checkRows(
      [
        {
          id: 'RC_BOMB_SHOP_ITEM_01',
          type: 'RCTYPE_SHOP',
          scene: 'SCENE_BOMYA',
        },
        {
          id: 'RC_ANCIENT_CASTLE_OF_IKANA_BOSS',
          type: 'RCTYPE_REMAINS',
          scene: 'SCENE_CASTLE',
        },
      ],
      byCheck,
      { RCTYPE_SHOP: 'Shop Items', RCTYPE_REMAINS: 'Boss Remains' },
      TYPES,
    ),
  ).toEqual([
    {
      id: 'RC_ANCIENT_CASTLE_OF_IKANA_BOSS',
      name: 'Ancient Castle Of Ikana Boss',
      type: 'Boss Remains',
      areas: ['B'],
      hintLocation: 'in B',
    },
    {
      id: 'RC_BOMB_SHOP_ITEM_01',
      name: 'Bomb Shop Item 01',
      type: 'Shop Items',
      areas: ['A'],
      hintLocation: 'in A',
    },
  ])
})

it('stops when a type of check has no label', () => {
  expect(() =>
    checkRows(
      [
        {
          id: 'RC_BOMB_SHOP_ITEM_01',
          type: 'RCTYPE_NEW',
          scene: 'SCENE_BOMYA',
        },
      ],
      new Map([
        ['RC_BOMB_SHOP_ITEM_01', { areas: ['A'], hintLocation: 'in A' }],
      ]),
      {},
      TYPES,
    ),
  ).toThrow('RCTYPE_NEW')
})

it('stops and names the file when a table is missing', () => {
  expect(() => parseChecks('')).toThrow('Checks.cpp')
  expect(() => parseItems('')).toThrow('Items.cpp')
  expect(() => parseCheckTypeLabels('')).toThrow('Menu.cpp')
  expect(() => parseOptions('', MENU, TYPES)).toThrow('Options.cpp')
  expect(() => parseOptions(OPTIONS, '', TYPES)).toThrow('Menu.cpp')
  expect(() => parseOptions(OPTIONS, MENU, '')).toThrow('Types.h')
  expect(() => parseScenes('')).toThrow('scene_table.h')
  expect(() => parseRegions([], TYPES)).toThrow('Logic/Regions')
  expect(() => parseRegions([SOUTH_REGIONS], '')).toThrow('Types.h')
})
