interface CheckData {
  areas: string[]
  hintLocation: string
  id: string
  name: string
  type: string
}

export interface OptionData {
  group: string
  kind: 'choice' | 'number' | 'time' | 'toggle'
  label: string
  // For a choice: each value, and what the menu calls it
  values?: Record<string, string>
}

export interface TwoShipData {
  areas: string[]
  checks: CheckData[]
  items: Record<string, string>
  options: Record<string, OptionData>
}

// As JSON imports them, which widens kind to a string
export interface TwoShipFiles {
  areas: string[]
  checks: CheckData[]
  items: Record<string, string>
  options: Record<string, Omit<OptionData, 'kind'> & { kind: string }>
}

// The generator writes only the kinds OptionData names
export function toTwoShipData(files: TwoShipFiles): TwoShipData {
  return { ...files, options: files.options as Record<string, OptionData> }
}

export interface TwoShipLookups {
  areaOrder: readonly string[]
  checkData(code: string): CheckData | undefined
  // Position in the game's enum; Infinity for a check Lens lacks
  checkRank(code: string): number
  choices: Map<string, Map<string, string>>
  itemName(code: string): string
  options: Map<string, OptionData>
}

export const OTHER = 'Other'

// Mirrors the game's convertEnumToReadableName
export function readableName(code: string, prefix: string): string {
  const name = code.startsWith(prefix) ? code.slice(prefix.length) : code
  return name
    .split('_')
    .map((w) => {
      const word = w.toLowerCase()
      return word === 'hp' ? 'HP' : word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

export function buildTwoShipLookups(data: TwoShipData): TwoShipLookups {
  const itemNames = new Map<string, string>(Object.entries(data.items))
  const checkTable = new Map<string, CheckData>(
    data.checks.map((check) => [check.id, check]),
  )
  const checkRanks = new Map<string, number>(
    data.checks.map((check, index) => [check.id, index]),
  )
  const options = new Map<string, OptionData>(Object.entries(data.options))
  const choices = new Map<string, Map<string, string>>(
    [...options].flatMap(([code, { values }]) =>
      values ? [[code, new Map(Object.entries(values))]] : [],
    ),
  )

  return {
    areaOrder: data.areas,
    checkData: (code) => checkTable.get(code),
    checkRank: (code) => checkRanks.get(code) ?? Infinity,
    choices,
    itemName: (code) => itemNames.get(code) ?? readableName(code, 'RI_'),
    options,
  }
}
