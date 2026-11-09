export interface CheckData {
  code: string
  name: string
  number: number
  type: string
  world: string
}

export interface ItemData {
  code: string
  name: string
}

export interface OptionData {
  label: string
  values: Record<string, string>
}

export interface LighthouseData {
  // The game's abilityNameList: what a molehill teaches, by collection id
  abilities: string[]
  // Without RC_UNKNOWN
  checks: CheckData[]
  items: Record<string, ItemData>
  // Starting ability and item names, by the game's enum values
  loadout: { abilities: Record<string, string>; items: Record<string, string> }
  options: Record<string, OptionData>
  source: { commit: string; release: string }
  // In RandoCheckType order
  types: string[]
  // In the pause menu's order
  worlds: string[]
}

export const UNKNOWN = 'Unknown'

export interface LighthouseLookups {
  abilityName(index: number): string | undefined
  checkByCode(code: string): CheckData | undefined
  checkByNumber(n: number): CheckData | undefined
  itemByNumber(n: number): ItemData | undefined
  loadoutAbility(n: number): string | undefined
  loadoutItem(n: number): string | undefined
  options: Map<string, OptionData>
  release: string
  typeOrder: readonly string[]
  worldOrder: readonly string[]
}

export function buildLighthouseLookups(
  data: LighthouseData,
): LighthouseLookups {
  const byCode = new Map(data.checks.map((check) => [check.code, check]))
  const byNumber = new Map(data.checks.map((check) => [check.number, check]))
  const items = new Map(Object.entries(data.items))
  const abilities = new Map(Object.entries(data.loadout.abilities))
  const loadoutItems = new Map(Object.entries(data.loadout.items))

  return {
    abilityName: (index) => data.abilities.at(index < 0 ? Infinity : index),
    checkByCode: (code) => byCode.get(code),
    checkByNumber: (n) => byNumber.get(n),
    itemByNumber: (n) => items.get(String(n)),
    loadoutAbility: (n) => abilities.get(String(n)),
    loadoutItem: (n) => loadoutItems.get(String(n)),
    options: new Map(Object.entries(data.options)),
    release: data.source.release,
    typeOrder: data.types,
    worldOrder: data.worlds,
  }
}
