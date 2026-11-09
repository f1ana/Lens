import type {
  CheckData,
  ItemData,
  LighthouseData,
  OptionData,
} from '../../src/formats/lighthouse/lookups.ts'
import {
  capture,
  enumValues,
  fail,
  strings,
  stripComments,
  typedefEnumItems,
} from '../lib/cpp.ts'
import { readableName } from '../lib/readable-name.ts'

const RANDO_DIR = 'src/port/Rando'

export const FILES = {
  types: `${RANDO_DIR}/Types.h`,
  checks: `${RANDO_DIR}/StaticData/Checks.cpp`,
  items: `${RANDO_DIR}/StaticData/Items.cpp`,
  options: `${RANDO_DIR}/StaticData/Options.cpp`,
  menu: `${RANDO_DIR}/LighthouseMenuRando.cpp`,
  saveData: `${RANDO_DIR}/Logic/GenerateSaveData.cpp`,
  shipUtils: 'src/port/ShipUtils.cpp',
  pauseMenu: 'src/core2/gc/pauseMenu.c',
  abilities: 'include/core2/abilityprogress.h',
  enums: 'include/enums.h',
}

// The menu spells it "Stop n Swop Hunt"; the enum code reads "Stop N Swop"
const TYPE_NAME_FIXES = new Map([['RCTYPE_STOP_N_SWOP', 'Stop n Swop']])

function stringList(text: string, name: string, file: string): string[] {
  const block = new RegExp(String.raw`\b${name}\s*=\s*\{([\s\S]*?)\}`).exec(
    stripComments(text),
  )?.[1]
  const values = strings(block ?? '')
  if (values.length === 0) fail(file, `no ${name} entries found`)
  return values
}

function titleCase(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function positions(typesH: string, name: string): Map<string, number> {
  return new Map(
    typedefEnumItems(typesH, name, FILES.types).map((id, i) => [id, i]),
  )
}

export function parseLevelAbbreviations(shipUtilsCpp: string): string[] {
  return stringList(shipUtilsCpp, 'levelAbbreviations', FILES.shipUtils)
}

export function parseAbilityNames(shipUtilsCpp: string): string[] {
  return stringList(shipUtilsCpp, 'abilityNameList', FILES.shipUtils)
}

// In the pause menu's order
export function parseWorlds(pauseMenuC: string): Map<string, string> {
  const block = /\bD_8036C58C\s*\[[^\]]*\]\s*=\s*\{([\s\S]*?)\n\s*\}\s*;/.exec(
    stripComments(pauseMenuC),
  )?.[1]
  const worlds = new Map(
    Array.from(
      (block ?? '').matchAll(
        /\{\s*(LEVEL_\w+)\s*,\s*[^,]+,\s*"((?:[^"\\]|\\.)*)"\s*\}/g,
      ),
      (m) => [capture(m, 1), titleCase(capture(m, 2))] as const,
    ),
  )
  if (worlds.size === 0) fail(FILES.pauseMenu, 'no level names found')
  return worlds
}

export function parseTypes(typesH: string): { code: string; name: string }[] {
  const types = typedefEnumItems(typesH, 'RandoCheckType', FILES.types)
    .filter((code) => code !== 'RCTYPE_UNKNOWN' && code !== 'RCTYPE_MAX')
    .map((code) => {
      const fixed = TYPE_NAME_FIXES.get(code)
      if (fixed !== undefined)
        console.warn(`${code}: shown as "${fixed}", the menu's spelling`)
      return { code, name: fixed ?? readableName(code, 'RCTYPE_') }
    })
  if (types.length === 0) fail(FILES.types, 'no RandoCheckType values found')
  return types
}

export function parseChecks(
  checksCpp: string,
  typesH: string,
  shipUtilsCpp: string,
  worlds: Map<string, string>,
  types: { code: string; name: string }[],
): CheckData[] {
  const numbers = positions(typesH, 'RandoCheckId')
  const abbreviations = parseLevelAbbreviations(shipUtilsCpp)
  const typeNames = new Map(types.map(({ code, name }) => [code, name]))
  const checks = Array.from(
    stripComments(checksCpp).matchAll(
      /\bRC\(\s*(RC_\w+)\s*,\s*(RCTYPE_\w+)\s*,\s*(LEVEL_\w+)\s*,/g,
    ),
    (m) => ({ code: capture(m, 1), type: capture(m, 2), level: capture(m, 3) }),
  )
    .filter(({ code }) => code !== 'RC_UNKNOWN')
    .map(({ code, type, level }): CheckData => {
      const number = numbers.get(code)
      if (number === undefined)
        fail(FILES.types, `${code} is not in RandoCheckId`)
      const world = worlds.get(level)
      if (world === undefined)
        fail(FILES.checks, `${code} is in ${level}, which has no name`)
      const typeName = typeNames.get(type)
      if (typeName === undefined)
        fail(FILES.checks, `${code} has unknown type ${type}`)
      return {
        code,
        name: readableName(code, 'RC_', abbreviations),
        number,
        type: typeName,
        world,
      }
    })
    .sort((a, b) => a.number - b.number)
  if (checks.length === 0) fail(FILES.checks, 'no RC rows found')
  return checks
}

export function parseItems(
  itemsCpp: string,
  typesH: string,
): Record<string, ItemData> {
  const numbers = positions(typesH, 'RandoItemId')
  const rows = Array.from(
    stripComments(itemsCpp).matchAll(
      /\bRI\(\s*(RI_\w+)\s*,\s*"(?:[^"\\]|\\.)*"\s*,\s*"((?:[^"\\]|\\.)*)"/g,
    ),
    (m) => {
      const code = capture(m, 1)
      const number = numbers.get(code)
      if (number === undefined)
        fail(FILES.types, `${code} is not in RandoItemId`)
      return [String(number), { code, name: capture(m, 2) }] as const
    },
  )
  if (rows.length === 0) fail(FILES.items, 'no RI rows found')
  return Object.fromEntries(rows)
}

// Finds the enum by one of its members
function valueNames(typesH: string, member: string): Record<string, string> {
  const text = stripComments(typesH)
  for (const m of text.matchAll(/typedef\s+enum\s*\{([^}]*)\}\s*(\w+)\s*;/g)) {
    const members = typedefEnumItems(m[0], capture(m, 2), FILES.types)
    if (!members.includes(member)) continue
    const prefix = commonPrefix(members)
    return Object.fromEntries(
      members.map((code, i) => [String(i), readableName(code, prefix)]),
    )
  }
  fail(FILES.types, `no enum holds ${member}`)
}

function commonPrefix(names: string[]): string {
  const first = names[0] ?? ''
  let length = first.length
  for (const name of names) {
    let i = 0
    while (i < length && name.charAt(i) === first.charAt(i)) i++
    length = i
  }
  return first.slice(0, first.lastIndexOf('_', length - 1) + 1)
}

// Keyed by the first option a widget mentions
function menuLabels(menuCpp: string): Map<string, string> {
  const labels = new Map<string, string>()
  for (const widget of stripComments(menuCpp)
    .split(/\bAddWidget\s*\(/)
    .slice(1)) {
    const label = /^\s*\w+\s*,\s*"((?:[^"\\]|\\.)*)"/.exec(widget)?.[1]
    if (label === undefined) continue
    for (const m of widget.matchAll(/\bOptions\[(RO_\w+)\]/g)) {
      const code = capture(m, 1)
      if (!labels.has(code)) labels.set(code, label)
    }
  }
  return labels
}

export function parseOptions(
  optionsCpp: string,
  typesH: string,
  menuCpp: string,
): Record<string, OptionData> {
  const labels = menuLabels(menuCpp)
  const rows = Array.from(
    stripComments(optionsCpp).matchAll(
      /\bRO\(\s*(RO_\w+)\s*,\s*(RO_\w+)\s*\)/g,
    ),
    (m) => {
      const code = capture(m, 1)
      const label = labels.get(code)
      if (label === undefined) fail(FILES.menu, `no widget for ${code}`)
      return [
        code,
        { label, values: valueNames(typesH, capture(m, 2)) },
      ] as const
    },
  )
  if (rows.length === 0) fail(FILES.options, 'no RO rows found')
  return Object.fromEntries(rows)
}

// Rows shaped like { ENUM_MEMBER, { "Name", ... } }
function loadoutRows(
  text: string,
  name: string,
  values: Map<string, number>,
  file: string,
): Record<string, string> {
  const start = text.search(new RegExp(String.raw`\b${name}\s*=`))
  if (start === -1) fail(FILES.saveData, `no ${name} found`)
  const end = text.indexOf('\n};', start)
  const block = text.slice(start, end === -1 ? undefined : end)
  const rows = Array.from(
    block.matchAll(/\{\s*(\w+)\s*,\s*\{\s*"((?:[^"\\]|\\.)*)"/g),
    (m) => {
      const value = values.get(capture(m, 1))
      if (value === undefined) fail(file, `no value for ${capture(m, 1)}`)
      return [String(value), capture(m, 2)] as const
    },
  )
  if (rows.length === 0) fail(FILES.saveData, `no ${name} rows found`)
  return Object.fromEntries(rows)
}

export function parseLoadout(
  saveDataCpp: string,
  abilityH: string,
  enumsH: string,
): LighthouseData['loadout'] {
  const text = stripComments(saveDataCpp)
  return {
    abilities: loadoutRows(
      text,
      'abilityLoadoutMap',
      enumValues(abilityH, 'ability_e', FILES.abilities),
      FILES.abilities,
    ),
    items: loadoutRows(
      text,
      'itemLoadoutMap',
      enumValues(enumsH, 'item_e', FILES.enums),
      FILES.enums,
    ),
  }
}
