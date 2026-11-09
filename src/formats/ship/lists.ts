import type { SectionBody } from '@/formats/shared/sections'
import { display, rowsSection } from '@/formats/shared/sections'
import { isRecord } from '@/lib/is-record'
import type { PlainRow } from '@/model/seed'

const INVENTORY_KEY = /^(Start with |Starting Bottle )/
const INVENTORY_NAMES = new Set([
  'Starting Hearts',
  'Full Wallets',
  'Gold Skulltula Tokens',
])
const EMPTY_INVENTORY_VALUES = new Set(['Off', 'No', 'None', '0'])

// Keys Lens reads somewhere; anything else goes in Other data
export const KNOWN_KEYS: ReadonlySet<string> = new Set([
  'version',
  'fileType',
  'git_branch',
  'git_commit',
  'seed',
  'finalSeed',
  'file_hash',
  'settings',
  'excludedLocations',
  'enabledTricks',
  'masterQuestDungeons',
  'requiredTrials',
  'SelectedStartingAge',
  'playthrough',
  'Gossip Stone Hints',
  'Static Hints',
  'entrances',
  'entrancesMap',
  'locations',
])

function isInventoryKey(key: string): boolean {
  return INVENTORY_KEY.test(key) || INVENTORY_NAMES.has(key)
}

function readSettings(
  log: Record<string, unknown>,
): [string, unknown][] | null {
  const { settings } = log
  if (settings === undefined) return null
  if (!isRecord(settings)) throw new Error('settings is not an object')
  return Object.entries(settings)
}

function settingRows(entries: [string, unknown][]): PlainRow[] {
  return entries.map(([key, value]) => ({
    kind: 'plain',
    id: key,
    primary: key,
    secondary: display(value),
  }))
}

export function settingsSection(
  log: Record<string, unknown>,
): null | SectionBody {
  const entries = readSettings(log)
  if (!entries) return null
  return rowsSection(
    settingRows(entries.filter(([key]) => !isInventoryKey(key))),
  )
}

export function startingInventorySection(
  log: Record<string, unknown>,
): null | SectionBody {
  const entries = readSettings(log)
  if (!entries) return null
  return rowsSection(
    settingRows(
      entries.filter(
        ([key, value]) =>
          isInventoryKey(key) && !EMPTY_INVENTORY_VALUES.has(display(value)),
      ),
    ),
  )
}
