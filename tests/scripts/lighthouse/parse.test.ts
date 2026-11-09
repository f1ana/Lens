import {
  parseAbilityNames,
  parseChecks,
  parseItems,
  parseLevelAbbreviations,
  parseLoadout,
  parseOptions,
  parseTypes,
  parseWorlds,
} from '../../../scripts/lighthouse/parse'

// Trimmed from src/port/Rando/Types.h at 1.2.2.
const TYPES = `
typedef enum {
    RCTYPE_UNKNOWN,
    RCTYPE_EMPTY_HONEYCOMB,
    RCTYPE_JIGGY,
    RCTYPE_MOLEHILL,
    RCTYPE_STOP_N_SWOP,
    RCTYPE_MAX,
} RandoCheckType;

typedef enum {
    RC_UNKNOWN,
    RC_BGS_EMPTY_HONEYCOMB_MUMBOS,
    RC_BGS_EMPTY_HONEYCOMB_TANKTUP,
    RC_BGS_JIGGY_CROCTUS,
    RC_SM_MOLEHILL_ATTACK,
    RC_MAX,
} RandoCheckId;

typedef enum {
    RI_UNKNOWN,
    RI_EMPTY_HONEYCOMB,
    RI_JIGGY,
    RI_MAX,
} RandoItemId;

typedef enum {
    RO_LOGIC,
    RO_SHUFFLE_STOP_N_SWOP,
    RO_MAX,
} RandoOptionId;

typedef enum {
    RO_GENERIC_OFF,
    RO_GENERIC_ON,
} RandoOptionGenericOffOn;

typedef enum {
    RO_LOGIC_GLITCHLESS,
    RO_LOGIC_NO_LOGIC,
} RandoOptionLogic;
`

// Trimmed from src/port/Rando/StaticData/Checks.cpp.
const CHECKS = `
#define RC(id, type, world, actor, cId, x, y, z)      \\
    {                                                 \\
        id, {                                         \\
            id, #id, type, world, actor, cId, x, y, z \\
        }                                             \\
    }

std::map<RandoCheckId, RandoStaticCheck> Checks = {
    RC(RC_UNKNOWN,                     RCTYPE_UNKNOWN,         LEVEL_D_CUTSCENE,          ACTOR_1_UNKNOWN,          NULL,                   0, 0, 0),
    RC(RC_BGS_EMPTY_HONEYCOMB_MUMBOS,  RCTYPE_EMPTY_HONEYCOMB, LEVEL_4_BUBBLEGLOOP_SWAMP, ACTOR_47_EMPTY_HONEYCOMB, HONEYCOMB_7_BGS_MUMBOS, 0, 600, 0),
    RC(RC_BGS_JIGGY_CROCTUS,           RCTYPE_JIGGY,           LEVEL_4_BUBBLEGLOOP_SWAMP, ACTOR_46_JIGGY,           JIGGY_22_CROCTUS,       0, 0, 0),
    RC(RC_SM_MOLEHILL_ATTACK,          RCTYPE_MOLEHILL,        LEVEL_B_SPIRAL_MOUNTAIN,   ACTOR_12C_MOLEHILL,       ABILITY_4_CLAW_SWIPE,   0, 0, 0),
};
`

// Trimmed from src/core2/gc/pauseMenu.c.
const PAUSE_MENU = `
struct1Cs_1 D_8036C58C[0xD] = {
    {0,                           0x50, "GAME TOTAL"},
    {LEVEL_B_SPIRAL_MOUNTAIN,     0x40, "SPIRAL MOUNTAIN"},
    {LEVEL_6_LAIR,                0x3C, "GRUNTILDA'S LAIR"},
    {LEVEL_1_MUMBOS_MOUNTAIN,     0x25, "MUMBO'S MOUNTAIN"},
    {LEVEL_4_BUBBLEGLOOP_SWAMP,   0x23, "BUBBLEGLOOP SWAMP"},
    {LEVEL_8_CLICK_CLOCK_WOOD,    0x30, "CLICK CLOCK WOOD"},
    {0,                           0x48, "STOP 'N' SWOP"}
};
`

// Trimmed from src/port/ShipUtils.cpp.
const SHIP_UTILS = `
std::vector<std::string> abilityNameList = { "Beak Barge", "Beak Bomb",   "Beak Buster",  "Camera Control",
                                             "Claw Swipe", "Climb" };

std::vector<std::string> levelAbbreviations = {
    "MM", "TTC", "CC", "BGS", "FP", "GL", "GV", "CCW", "RBB", "MMM", "SM",
};
`

// Trimmed from src/port/Rando/StaticData/Items.cpp.
const ITEMS = `
#define RI(id, article, name, type, actorId)      \\
    {                                             \\
        id, {                                     \\
            id, #id, article, name, type, actorId \\
        }                                         \\
    }

std::map<RandoItemId, RandoStaticItem> Items = {
    RI(RI_UNKNOWN,          "",     "Unknown",          RITYPE_UNKNOWN,         ACTOR_1_UNKNOWN),
    RI(RI_EMPTY_HONEYCOMB,  "an",   "Empty Honeycomb",  RITYPE_EMPTY_HONEYCOMB, ACTOR_47_EMPTY_HONEYCOMB),
    RI(RI_JIGGY,            "a",    "Jiggy",            RITYPE_JIGGY,           ACTOR_46_JIGGY),
};
`

// Trimmed from src/port/Rando/StaticData/Options.cpp.
const OPTIONS = `
#define RO(id, defaultValue)                             \\
    {                                                    \\
        id, {                                            \\
            id, #id, "gRando.Options." #id, defaultValue \\
        }                                                \\
    }

std::map<RandoOptionId, RandoStaticOption> Options = {
    RO(RO_LOGIC,                    RO_LOGIC_GLITCHLESS),
    RO(RO_SHUFFLE_STOP_N_SWOP,      RO_GENERIC_OFF),
};
`

// Trimmed from src/port/Rando/LighthouseMenuRando.cpp.
const MENU = `
    AddWidget(path, "Enable Rando", WIDGET_CVAR_CHECKBOX)
        .CVar(CVAR_RANDOMIZER_SETTING("Enable"));
    AddWidget(path, "Logic Mode", WIDGET_CUSTOM).CustomFunction([](WidgetInfo& info) {
        int32_t currentIndex = CVarGetInteger(Rando::StaticData::Options[RO_LOGIC].cvar, 0);
        CVarSetInteger(Rando::StaticData::Options[RO_LOGIC].cvar, i);
    });
    AddWidget(path, "Win Conditions", WIDGET_SEPARATOR_TEXT);
    AddWidget(path, "Stop n Swop Hunt", WIDGET_CVAR_CHECKBOX)
        .CVar(Rando::StaticData::Options[RO_SHUFFLE_STOP_N_SWOP].cvar)
        .Options(CheckboxOptions().Tooltip("Shuffles Stop n Swop items into the Pool, collect all of them to win."));
`

// Trimmed from src/port/Rando/Logic/GenerateSaveData.cpp.
const SAVE_DATA = `
std::map<ability_e, std::pair<const char*, const char*>> abilityLoadoutMap = {
    { ABILITY_0_BARGE,              { "Beak Barge",         CVAR_RANDOMIZER_SETTING("Loadout.Abilities.BeakBarge") } },
    { ABILITY_A_HOLD_A_JUMP_HIGHER, { "Jump Higher",        CVAR_RANDOMIZER_SETTING("Loadout.Abilities.JumpHigher") } },
    { ABILITY_13_1ST_NOTEDOOR,      { "First Note Door",    CVAR_RANDOMIZER_SETTING("Loadout.Abilities.NoteDoor") } },
};

std::map<item_e, std::pair<const char*, const char*>> itemLoadoutMap = {
    { ITEM_D_EGGS,          { "Blue Eggs",      CVAR_RANDOMIZER_SETTING("Loadout.Items.BlueEggs") } },
    { ITEM_F_RED_FEATHER,   { "Red Feathers",   CVAR_RANDOMIZER_SETTING("Loadout.Items.RedFeathers") } },
};

std::vector<file_progress_e> progressLoadout = {
    FILEPROG_3_MUSIC_NOTE_TEXT,
};
`

const ABILITY_H = `
enum ability_e {
    ABILITY_0_BARGE,
    ABILITY_1, ABILITY_2, ABILITY_3, ABILITY_4, ABILITY_5, ABILITY_6, ABILITY_7, ABILITY_8, ABILITY_9,
    ABILITY_A_HOLD_A_JUMP_HIGHER,
    ABILITY_B, ABILITY_C, ABILITY_D, ABILITY_E, ABILITY_F, ABILITY_10, ABILITY_11, ABILITY_12,
    ABILITY_13_1ST_NOTEDOOR
};
`

const ENUMS_H = `
enum item_e
{
    ITEM_0_HOURGLASS_TIMER = 0x0,
    ITEM_C_NOTE = 0xC,
    ITEM_D_EGGS,
    ITEM_E_JIGGY,
    ITEM_F_RED_FEATHER,
    ITEM_2B_UNKNOWN = 0x2B //uses jiggy model
};
`

const WORLDS = parseWorlds(PAUSE_MENU)
const KINDS = parseTypes(TYPES)

it('reads the worlds in pause-menu order, title-cased', () => {
  expect([...WORLDS.values()]).toEqual([
    'Spiral Mountain',
    "Gruntilda's Lair",
    "Mumbo's Mountain",
    'Bubblegloop Swamp',
    'Click Clock Wood',
  ])
  expect(WORLDS.get('LEVEL_4_BUBBLEGLOOP_SWAMP')).toBe('Bubblegloop Swamp')
})

it('names the pause menu when its table is missing', () => {
  expect(() => parseWorlds('')).toThrow(/pauseMenu\.c/)
})

it('reads the check types, with the menu spelling of Stop n Swop', () => {
  expect(KINDS).toEqual([
    { code: 'RCTYPE_EMPTY_HONEYCOMB', name: 'Empty Honeycomb' },
    { code: 'RCTYPE_JIGGY', name: 'Jiggy' },
    { code: 'RCTYPE_MOLEHILL', name: 'Molehill' },
    { code: 'RCTYPE_STOP_N_SWOP', name: 'Stop n Swop' },
  ])
})

it('reads the level abbreviations and ability names', () => {
  expect(parseLevelAbbreviations(SHIP_UTILS)).toHaveLength(11)
  expect(parseAbilityNames(SHIP_UTILS)[4]).toBe('Claw Swipe')
})

it('reads each check with its number, name, type and world', () => {
  const checks = parseChecks(CHECKS, TYPES, SHIP_UTILS, WORLDS, KINDS)
  expect(checks).toContainEqual({
    code: 'RC_BGS_JIGGY_CROCTUS',
    name: 'Jiggy Croctus',
    number: 3,
    type: 'Jiggy',
    world: 'Bubblegloop Swamp',
  })
  expect(checks.map((c) => c.code)).toEqual([
    'RC_BGS_EMPTY_HONEYCOMB_MUMBOS',
    'RC_BGS_JIGGY_CROCTUS',
    'RC_SM_MOLEHILL_ATTACK',
  ])
})

it('fails for a check in a world the pause menu lacks', () => {
  const odd = CHECKS.replace(
    'LEVEL_B_SPIRAL_MOUNTAIN,  ',
    'LEVEL_C_BOSS,             ',
  )
  expect(() => parseChecks(odd, TYPES, SHIP_UTILS, WORLDS, KINDS)).toThrow(
    /Checks\.cpp/,
  )
})

it('reads item names by number', () => {
  expect(parseItems(ITEMS, TYPES)).toEqual({
    0: { code: 'RI_UNKNOWN', name: 'Unknown' },
    1: { code: 'RI_EMPTY_HONEYCOMB', name: 'Empty Honeycomb' },
    2: { code: 'RI_JIGGY', name: 'Jiggy' },
  })
})

it('reads option labels from the menu and values from Types.h', () => {
  expect(parseOptions(OPTIONS, TYPES, MENU)).toEqual({
    RO_LOGIC: {
      label: 'Logic Mode',
      values: { 0: 'Glitchless', 1: 'No Logic' },
    },
    RO_SHUFFLE_STOP_N_SWOP: {
      label: 'Stop n Swop Hunt',
      values: { 0: 'Off', 1: 'On' },
    },
  })
})

it('fails for an option the menu has no widget for', () => {
  const menu = MENU.replace('Options[RO_SHUFFLE_STOP_N_SWOP]', 'Other')
  expect(() => parseOptions(OPTIONS, TYPES, menu)).toThrow(
    /LighthouseMenuRando\.cpp/,
  )
})

it('reads the starting ability and item names by enum value', () => {
  expect(parseLoadout(SAVE_DATA, ABILITY_H, ENUMS_H)).toEqual({
    abilities: { 0: 'Beak Barge', 10: 'Jump Higher', 19: 'First Note Door' },
    items: { 13: 'Blue Eggs', 15: 'Red Feathers' },
  })
})
