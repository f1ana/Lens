import { songsSection } from '@/formats/shared/check-rows'
import {
  counted,
  listSection,
  otherDataSection,
  readSections,
} from '@/formats/shared/sections'
import type { Fact, GameTheme, LogFormat, OpenResult } from '@/model/seed'

import { identifyBuild, SUPPORTED_VERSIONS } from './build'
import { checksSection, holdsSong, readChecks, spheresSection } from './checks'
import { loadShipLookups } from './data-loader'
import { entrancesSection } from './entrances'
import { attachHints, hintsSection } from './hints'
import { KNOWN_KEYS, settingsSection, startingInventorySection } from './lists'
import type { ShipLookups } from './lookups'
import { isBelowMinimum, MINIMUM_VERSION, parseVersion } from './version'

const PORT = 'Ship of Harkinian'
const THEME: GameTheme = 'ship'

// Not version, seed or settings: plenty of JSON files have those
const RECOGNIZING_KEYS = [
  'file_hash',
  'git_commit',
  'playthrough',
  'locations',
  'Gossip Stone Hints',
  'Static Hints',
]

function recognizes(log: Record<string, unknown>): boolean {
  return RECOGNIZING_KEYS.filter((key) => Object.hasOwn(log, key)).length >= 2
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function readHash(log: Record<string, unknown>): null | number[] {
  const hash = log.file_hash
  if (!Array.isArray(hash) || hash.length === 0) return null
  const numbers = hash as unknown[]
  return numbers.every((n) => Number.isInteger(n) && (n as number) >= 0)
    ? (numbers as number[])
    : null
}

function formatHash(hash: number[]): string {
  return hash.map((n) => String(n).padStart(2, '0')).join('-')
}

function readFacts(
  hash: null | number[],
  log: Record<string, unknown>,
  hashIcons: readonly string[],
): Fact[] {
  const facts: Fact[] = []
  if (hash) {
    facts.push({
      label: 'Hash',
      value: formatHash(hash),
    })
    const names = hash.map((n): string | undefined => hashIcons.at(n))
    if (names.every((name) => name !== undefined))
      facts.push({ label: 'Hash icons', value: names.join(', ') })
  }
  const age = text(log.SelectedStartingAge)
  if (age !== undefined) facts.push({ label: 'Starting age', value: age })
  return facts
}

function readDetails(log: Record<string, unknown>): Fact[] {
  const details: [string, unknown][] = [
    ['Branch', log.git_branch],
    ['Commit', log.git_commit],
    ['Final seed', log.finalSeed],
  ]
  return details.flatMap(([label, value]) =>
    typeof value === 'string' || typeof value === 'number'
      ? [{ label, value: String(value) }]
      : [],
  )
}

export function readShip(
  log: Record<string, unknown>,
  lookups: ShipLookups,
): OpenResult {
  const title = text(log.seed) ?? 'Unnamed seed'
  const subtitle = text(log.version) ?? 'Unknown version'
  const hash = readHash(log)

  const checks = readChecks(log, lookups)
  attachHints(log, checks)

  return {
    status: 'opened',
    seed: {
      key: `${subtitle}|${title}|${hash ? formatHash(hash) : ''}`,
      title,
      subtitle,
      provenance: { port: PORT, theme: THEME, build: identifyBuild(log) },
      facts: readFacts(hash, log, lookups.hashIcons),
      details: readDetails(log),
      checks,
      sections: readSections([
        {
          id: 'checks',
          title: 'Checks',
          read: () => checksSection(log, checks, lookups),
        },
        {
          id: 'songs',
          title: 'Songs',
          read: () => songsSection(checks, holdsSong),
        },
        { id: 'hints', title: 'Hints', read: () => hintsSection(log) },
        { id: 'spheres', title: 'Spheres', read: () => spheresSection(log) },
        { id: 'settings', title: 'Settings', read: () => settingsSection(log) },
        {
          id: 'starting-inventory',
          title: 'Starting Inventory',
          read: () => startingInventorySection(log),
        },
        {
          id: 'excluded-locations',
          title: 'Excluded Locations',
          read: () => counted(listSection(log.excludedLocations)),
        },
        {
          id: 'tricks',
          title: 'Tricks',
          read: () => counted(listSection(log.enabledTricks)),
        },
        {
          id: 'entrances',
          title: 'Entrances',
          read: () => entrancesSection(log, lookups),
        },
        {
          id: 'required-trials',
          title: 'Required Trials',
          read: () => listSection(log.requiredTrials),
        },
        {
          id: 'master-quest-dungeons',
          title: 'Master Quest Dungeons',
          read: () => listSection(log.masterQuestDungeons),
        },
        {
          id: 'other-data',
          title: 'Other data',
          read: () => otherDataSection(log, KNOWN_KEYS),
        },
      ]),
    },
  }
}

// Lens has no data below the minimum, so reject before loading
async function read(log: Record<string, unknown>): Promise<OpenResult> {
  const version = parseVersion(log.version)
  if (version && isBelowMinimum(version)) {
    return {
      status: 'rejected',
      reason: 'unsupported-version',
      message: `This log is from Ship version ${version.join('.')}. Lens supports ${MINIMUM_VERSION.join('.')} and newer.`,
    }
  }
  const lookups = await loadShipLookups(version?.join('.') ?? null)
  return readShip(log, lookups)
}

export const shipFormat: LogFormat = {
  name: PORT,
  supported: SUPPORTED_VERSIONS,
  theme: THEME,
  recognizes,
  read,
}
