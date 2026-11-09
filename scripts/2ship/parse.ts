import { capture, fail, stripComments, typedefEnumItems } from '../lib/cpp.ts'
import { readableName } from '../lib/readable-name.ts'

export { readableName }

export interface OptionData {
  group: string
  kind: 'choice' | 'number' | 'time' | 'toggle'
  label: string
  // Choices only: each value and what the menu calls it
  values?: Record<string, string>
}

export interface Region {
  checks: string[]
  connections: string[]
  exits: { from: string; to: string }[]
  id: string
  scene: string
}

export interface AreaInput {
  checks: { id: string; scene: string; type: string }[]
  regions: Region[]
  scenes: Map<string, { name: string; order: number }>
}

const RANDO_DIR = 'mm/2s2h/Rando'

export const REGIONS_DIR = `${RANDO_DIR}/Logic/Regions`

export const FILES = {
  checks: `${RANDO_DIR}/StaticData/Checks.cpp`,
  items: `${RANDO_DIR}/StaticData/Items.cpp`,
  options: `${RANDO_DIR}/StaticData/Options.cpp`,
  menu: `${RANDO_DIR}/Menu.cpp`,
  types: `${RANDO_DIR}/Types.h`,
  sceneTable: 'mm/include/tables/scene_table.h',
}

export function parseChecks(
  checksCpp: string,
): { id: string; scene: string; type: string }[] {
  const checks = Array.from(
    stripComments(checksCpp).matchAll(
      /\bRC\(\s*(RC_\w+)\s*,\s*(RCTYPE_\w+)\s*,\s*(SCENE_\w+)\s*,/g,
    ),
    (m) => ({ id: capture(m, 1), type: capture(m, 2), scene: capture(m, 3) }),
  ).filter((c) => c.id !== 'RC_UNKNOWN')
  if (checks.length === 0) fail(FILES.checks, 'no RC rows found')
  return checks
}

/*
 * The game swaps only RI_JUNK and RI_TRAP for another name. Lens renames Trap
 * from "Knockoff Item", and Nothing because "literally nothing" isn't usable.
 */
const ITEM_NAMES: Record<string, string> = {
  RI_TRAP: 'Trap',
  RI_NONE: 'Nothing',
}

export function parseItems(itemsCpp: string): Record<string, string> {
  const items: Record<string, string> = {}
  for (const m of stripComments(itemsCpp).matchAll(
    /\bRI\(\s*(RI_\w+)\s*,\s*"[^"]*"\s*,\s*"((?:[^"\\]|\\.)*)"/g,
  )) {
    items[capture(m, 1)] = capture(m, 2)
  }
  if (Object.keys(items).length === 0) fail(FILES.items, 'no RI rows found')
  return { ...items, ...ITEM_NAMES }
}

export function parseCheckTypeLabels(menuCpp: string): Record<string, string> {
  const block = /checkTypeNames\s*=\s*\{([\s\S]*?)\}\s*;/.exec(
    stripComments(menuCpp),
  )?.[1]
  const labels = Object.fromEntries(
    Array.from(
      (block ?? '').matchAll(/\{\s*(RCTYPE_\w+)\s*,\s*"((?:[^"\\]|\\.)*)"/g),
      (m) => [capture(m, 1), capture(m, 2)] as const,
    ),
  )
  if (Object.keys(labels).length === 0) {
    fail(FILES.menu, 'no checkTypeNames rows found')
  }
  return labels
}

const CHOICE_ENUMS = [
  'RandoOptionLogic',
  'RandoOptionAccessDungeons',
  'RandoOptionAccessTrials',
  'RandoOptionDungeonItemPlacement',
  'RandoClockShuffleOptions',
]

const GROUPS: [string, string][] = [
  ['RO_HINTS_', 'Hints'],
  ['RO_SHUFFLE_', 'Shuffle'],
  ['RO_ACCESS_', 'Access'],
  ['RO_PLACEMENT_', 'Item Placement'],
  ['RO_STARTING_', 'Starting'],
  ['RO_CLOCK_', 'Time'],
]

type Widget = 'Checkbox' | 'Combobox' | 'SliderInt'

interface MenuEntry {
  // Variable name of the combobox's choice list
  choices?: string
  label: string
  widget: Widget
}

const QUOTED = String.raw`"((?:[^"\\]|\\.)*)"`

function menuEntries(menuCpp: string): Map<string, MenuEntry> {
  const menu = stripComments(menuCpp)
  const entries = new Map<string, MenuEntry>()
  const add = (code: string, entry: MenuEntry) => {
    if (!entries.has(code)) entries.set(code, entry)
  }

  for (const m of menu.matchAll(
    new RegExp(
      String.raw`\bCVar(Checkbox|SliderInt|Combobox)\(\s*${QUOTED}\s*,\s*Rando::StaticData::Options\[(RO_\w+)\]\.cvar(?:\s*,\s*&(\w+))?`,
      'g',
    ),
  )) {
    add(capture(m, 3), {
      label: capture(m, 2),
      widget: capture(m, 1) as Widget,
      choices: m.at(4),
    })
  }
  for (const m of menu.matchAll(
    new RegExp(
      String.raw`\b(?:ItemPool|CheckPool)Checkbox\(\s*${QUOTED}\s*,\s*(RO_\w+)`,
      'g',
    ),
  )) {
    add(capture(m, 2), { label: capture(m, 1), widget: 'Checkbox' })
  }
  for (const m of menu.matchAll(
    new RegExp(String.raw`\{\s*${QUOTED}\s*,\s*(RO_\w+)\s*,\s*RCTYPE_`, 'g'),
  )) {
    add(capture(m, 2), { label: capture(m, 1), widget: 'Checkbox' })
  }
  return entries
}

function choiceLists(menuCpp: string): Map<string, [string, string][]> {
  const lists = new Map<string, [string, string][]>()
  for (const m of stripComments(menuCpp).matchAll(
    /std::(?:unordered_)?map<int32_t,\s*const char\*>\s+(\w+)\s*=\s*\{([\s\S]*?)\}\s*;/g,
  )) {
    lists.set(
      capture(m, 1),
      Array.from(
        capture(m, 2).matchAll(
          new RegExp(String.raw`\{\s*(\w+)\s*,\s*${QUOTED}`, 'g'),
        ),
        (row) => [capture(row, 1), capture(row, 2)],
      ),
    )
  }
  return lists
}

export function parseOptions(
  optionsCpp: string,
  menuCpp: string,
  typesH: string,
): Record<string, OptionData> {
  const codes = Array.from(
    stripComments(optionsCpp).matchAll(/\bRO\(\s*(RO_\w+)\s*,/g),
    (m) => capture(m, 1),
  )
  if (codes.length === 0) fail(FILES.options, 'no RO rows found')

  const entries = menuEntries(menuCpp)
  const lists = choiceLists(menuCpp)
  const valueOf = new Map(
    CHOICE_ENUMS.flatMap((name) =>
      typedefEnumItems(typesH, name, FILES.types).map(
        (item, i) => [item, i] as const,
      ),
    ),
  )

  const choiceValues = (code: string, name: string | undefined) => {
    const list = name === undefined ? undefined : lists.get(name)
    if (list === undefined) fail(FILES.menu, `no choice list for ${code}`)
    return Object.fromEntries(
      list.map(([key, label]) => {
        const value = /^\d+$/.test(key) ? Number(key) : valueOf.get(key)
        if (value === undefined) fail(FILES.types, `no value for ${key}`)
        return [String(value), label]
      }),
    )
  }

  const options: Record<string, OptionData> = {}
  for (const code of codes) {
    const entry = entries.get(code)
    if (entry === undefined) fail(FILES.menu, `no label for ${code}`)
    const group = GROUPS.find(([prefix]) => code.startsWith(prefix))?.[1]
    const data: OptionData = {
      // The trap slider's own label only hides the widget's text
      label: entry.label.startsWith('##')
        ? readableName(code, 'RO_')
        : entry.label,
      group: group ?? 'General',
      kind: 'toggle',
    }
    if (entry.widget === 'Combobox') {
      data.kind = 'choice'
      data.values = choiceValues(code, entry.choices)
    } else if (code === 'RO_CLOCK_TERMINAL_TIME') {
      data.kind = 'time'
    } else if (entry.widget === 'SliderInt') {
      data.kind = 'number'
    }
    options[code] = data
  }
  return options
}

// `order` is the scene's place in the game's better map select
export function parseScenes(
  sceneTableH: string,
): Map<string, { name: string; order: number }> {
  const scenes = new Map(
    Array.from(
      stripComments(sceneTableH).matchAll(
        new RegExp(
          String.raw`\bDEFINE_SCENE\(\s*\w+\s*,\s*(SCENE_\w+)\b.*,\s*(\d+)\s*,\s*${QUOTED}\s*\)`,
          'g',
        ),
      ),
      (m) =>
        [
          capture(m, 1),
          { name: capture(m, 3), order: Number(capture(m, 2)) },
        ] as const,
    ),
  )
  if (scenes.size === 0) fail(FILES.sceneTable, 'no DEFINE_SCENE rows found')
  return scenes
}

const ENTRANCE = String.raw`ENTRANCE\(\s*\w+\s*,\s*\d+\s*\)`

const entrance = (text: string) => text.replace(/\s/g, '')

function parseRegion(block: string): Region {
  const id = /^Regions\[(RR_\w+)\]/.exec(block)?.[1]
  const scene = /\.sceneId\s*=\s*(SCENE_\w+)/.exec(block)?.[1]
  if (id === undefined || scene === undefined) {
    fail(REGIONS_DIR, `no scene in ${block.slice(0, 60)}`)
  }
  return {
    id,
    scene,
    checks: Array.from(block.matchAll(/\bCHECK\(\s*(RC_\w+)/g), (m) =>
      capture(m, 1),
    ),
    exits: Array.from(
      block.matchAll(
        new RegExp(
          String.raw`\bEXIT\(\s*(${ENTRANCE})\s*,\s*(${ENTRANCE}|ONE_WAY_EXIT)`,
          'g',
        ),
      ),
      (m) => ({ to: entrance(capture(m, 1)), from: entrance(capture(m, 2)) }),
    ),
    connections: Array.from(block.matchAll(/\bCONNECTION\(\s*(RR_\w+)/g), (m) =>
      capture(m, 1),
    ),
  }
}

export function parseRegions(regionFiles: string[], typesH: string): Region[] {
  const regions = new Map(
    regionFiles
      .flatMap((file) =>
        stripComments(file)
          .split(/(?=\bRegions\[RR_\w+\]\s*=\s*RandoRegion\b)/)
          .slice(1),
      )
      .map((block) => {
        const region = parseRegion(block)
        return [region.id, region] as const
      }),
  )
  if (regions.size === 0) fail(REGIONS_DIR, 'no regions found')
  return typedefEnumItems(typesH, 'RandoRegionId', FILES.types).flatMap(
    (id) => {
      const region = regions.get(id)
      return region ? [region] : []
    },
  )
}

// From Play_GetOriginalSceneId: variant scene to its default
const ORIGINAL_SCENES = new Map([
  ['SCENE_INISIE_R', 'SCENE_INISIE_N'],
  ['SCENE_20SICHITAI2', 'SCENE_20SICHITAI'],
  ['SCENE_10YUKIYAMANOMURA2', 'SCENE_10YUKIYAMANOMURA'],
  ['SCENE_11GORONNOSATO2', 'SCENE_11GORONNOSATO'],
  ['SCENE_17SETUGEN2', 'SCENE_17SETUGEN'],
  ['SCENE_F41', 'SCENE_F40'],
])

// From scenesToCheckParent: shown under the area they open from
const PARENT_SCENES = new Set([
  'SCENE_KAKUSIANA',
  'SCENE_TAKARAYA',
  'SCENE_BOWLING',
  'SCENE_SONCHONOIE',
  'SCENE_SYATEKI_MIZU',
  'SCENE_YADOYA',
  'SCENE_MILK_BAR',
  'SCENE_AYASHIISHOP',
  'SCENE_YOUSEI_IZUMI',
  'SCENE_DOUJOU',
  'SCENE_8ITEMSHOP',
  'SCENE_BOMYA',
  'SCENE_POSTHOUSE',
  'SCENE_TAKARAKUJI',
  'SCENE_SYATEKI_MORI',
  'SCENE_MAP_SHOP',
  'SCENE_WITCH_SHOP',
  'SCENE_F01C',
  'SCENE_F01_B',
  'SCENE_OMOYA',
  'SCENE_GORONSHOP',
  'SCENE_KAJIYA',
  'SCENE_FISHERMAN',
  'SCENE_LABO',
  'SCENE_BANDROOM',
  'SCENE_TOUGITES',
  'SCENE_MUSICHOUSE',
])

// From sCheckTrackerSceneNameOverrides
const AREA_NAMES = new Map([
  ['SCENE_20SICHITAI', 'Southern Swamp'],
  ['SCENE_10YUKIYAMANOMURA', 'Mountain Village'],
  ['SCENE_11GORONNOSATO', 'Goron Village'],
  ['SCENE_17SETUGEN', 'Path to Goron Village'],
  ['SCENE_KAKUSIANA', 'Lone Peak Shrine'],
])

// Mirrors initializeSceneChecks and GetLocationNameForHint
export function resolveAreas({ regions, scenes, checks }: AreaInput): {
  areas: string[]
  byCheck: Map<string, { areas: string[]; hintLocation: string }>
} {
  const regionById = new Map(regions.map((region) => [region.id, region]))
  // The later region wins when two declare an entrance, as in the game
  const regionByEntrance = new Map(
    regions.flatMap((region) =>
      region.exits
        .filter((exit) => exit.from !== 'ONE_WAY_EXIT')
        .map((exit) => [exit.from, region] as const),
    ),
  )

  const scene = (id: string) =>
    scenes.get(id) ?? fail(FILES.sceneTable, `no scene ${id}`)
  const areaName = (id: string) => AREA_NAMES.get(id) ?? scene(id).name
  const areaNames = (sceneIds: string[]) =>
    [...new Set(sceneIds)]
      .sort((a, b) => scene(a).order - scene(b).order)
      .map(areaName)

  const trackerScene = (region: Region): string | undefined => {
    const own = ORIGINAL_SCENES.get(region.scene) ?? region.scene
    if (!PARENT_SCENES.has(own) || region.id === 'RR_LONE_PEAK_SHRINE') {
      return own
    }
    // The game takes a parent's scene as it stands, without merging variants
    const parents = new Set(
      [
        ...region.exits.map((exit) => regionByEntrance.get(exit.to)),
        ...region.connections.map((id) => regionById.get(id)),
      ].flatMap((parent) => (parent ? [parent.scene] : [])),
    )
    if (parents.size > 1) {
      fail(REGIONS_DIR, `${region.id} reaches ${[...parents].join(' and ')}`)
    }
    return [...parents].at(0)
  }

  const placed = new Map<string, string[]>()
  for (const region of regions) {
    const sceneId = trackerScene(region)
    if (sceneId === undefined) continue
    for (const check of region.checks) {
      placed.set(check, [...(placed.get(check) ?? []), sceneId])
    }
  }

  const sceneIdsOf = (check: AreaInput['checks'][number]) =>
    placed.get(check.id) ?? [ORIGINAL_SCENES.get(check.scene) ?? check.scene]

  const hintLocation = (check: AreaInput['checks'][number]) => {
    // The game spells it "fomidable"
    if (check.type === 'RCTYPE_ENEMY_DROP') return 'within a formidable foe'
    // The game's map keeps whichever region wrote a check last
    const last = placed.get(check.id)?.at(-1)
    return last === undefined
      ? 'in an Unknown Location'
      : `in ${areaName(last)}`
  }

  return {
    areas: areaNames(checks.flatMap(sceneIdsOf)),
    byCheck: new Map(
      checks.map((check) => [
        check.id,
        {
          areas: areaNames(sceneIdsOf(check)),
          hintLocation: hintLocation(check),
        },
      ]),
    ),
  }
}

export interface CheckRow {
  areas: string[]
  hintLocation: string
  id: string
  name: string
  type: string
}

export function checkRows(
  checks: AreaInput['checks'],
  byCheck: Map<string, { areas: string[]; hintLocation: string }>,
  typeLabels: Record<string, string>,
  typesH: string,
): CheckRow[] {
  const labels = new Map(Object.entries(typeLabels))
  const order = new Map(
    typedefEnumItems(typesH, 'RandoCheckId', FILES.types).map(
      (id, i) => [id, i] as const,
    ),
  )
  const position = (id: string) =>
    order.get(id) ?? fail(FILES.types, `${id} is not in RandoCheckId`)

  return checks
    .map((check) => {
      const place =
        byCheck.get(check.id) ?? fail(REGIONS_DIR, `no area for ${check.id}`)
      return {
        id: check.id,
        name: readableName(check.id, 'RC_'),
        type:
          labels.get(check.type) ??
          fail(FILES.menu, `no label for ${check.type}`),
        ...place,
      }
    })
    .sort((a, b) => position(a.id) - position(b.id))
}
