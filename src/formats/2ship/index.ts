import { songsSection } from '@/formats/shared/check-rows'
import { checksDigest } from '@/formats/shared/digest'
import { otherDataSection, readSections } from '@/formats/shared/sections'
import type { Fact, GameTheme, LogFormat, OpenResult } from '@/model/seed'

import {
  identifyBuild,
  MINIMUM_VERSION,
  olderRelease,
  releaseName,
  releaseVersionOf,
  SUPPORTED_VERSIONS,
} from './build'
import { checksSection, readChecks, songHolders } from './checks'
import { loadTwoShipLookups } from './data-loader'
import { attachHints, hintsSection, readHints } from './hints'
import { itemListSection, settingsSection } from './lists'
import type { TwoShipLookups } from './lookups'

const PORT = '2 Ship 2 Harkinian'
const THEME: GameTheme = '2ship'

const MARKER = '2S2H_RANDO_SPOILER'

const KNOWN_KEYS: ReadonlySet<string> = new Set([
  'type',
  'commitHash',
  'inputSeed',
  'finalSeed',
  'checks',
  'options',
  'sariaPriorityItems',
  'startingItems',
])

// Not the marker alone, so a damaged type still opens
const RECOGNIZING_KEYS = [
  'commitHash',
  'inputSeed',
  'sariaPriorityItems',
  'startingItems',
  'options',
]

function recognizes(log: Record<string, unknown>): boolean {
  return (
    log.type === MARKER ||
    RECOGNIZING_KEYS.filter((key) => Object.hasOwn(log, key)).length >= 2
  )
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function readDetails(log: Record<string, unknown>): Fact[] {
  const details: [string, unknown][] = [
    ['Commit', log.commitHash],
    ['Final seed', log.finalSeed],
  ]
  return details.flatMap(([label, value]) =>
    typeof value === 'string' || typeof value === 'number'
      ? [{ label, value: String(value) }]
      : [],
  )
}

export function readTwoShip(
  log: Record<string, unknown>,
  lookups: TwoShipLookups,
): OpenResult {
  const title = text(log.inputSeed) ?? 'Unnamed seed'
  const commit = text(log.commitHash) ?? ''
  const finalSeed = typeof log.finalSeed === 'number' ? log.finalSeed : ''
  const checks = readChecks(log, lookups)
  const hints = readHints(log, lookups)
  attachHints(hints, checks)

  return {
    status: 'opened',
    seed: {
      key: `2S2H|${commit}|${title}|${finalSeed}|${checksDigest(log.checks)}`,
      title,
      subtitle: releaseName(log) ?? 'Unknown version',
      provenance: { port: PORT, theme: THEME, build: identifyBuild(log) },
      facts: [],
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
          read: () => {
            const holders = songHolders(log)
            return songsSection(checks, (c) => holders.has(c.id))
          },
        },
        { id: 'hints', title: 'Hints', read: () => hintsSection(hints) },
        {
          id: 'settings',
          title: 'Settings',
          read: () => settingsSection(log, lookups),
        },
        {
          id: 'starting-inventory',
          title: 'Starting Inventory',
          read: () => itemListSection(log.startingItems, lookups),
        },
        {
          id: 'saria-priority',
          title: 'Saria’s Song Priority',
          read: () => itemListSection(log.sariaPriorityItems, lookups),
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
  const older = olderRelease(log)
  if (older !== null) {
    return {
      status: 'rejected',
      reason: 'unsupported-version',
      message: `This log is from ${PORT} version ${older}. Lens supports ${MINIMUM_VERSION.join('.')} and newer.`,
    }
  }
  const lookups = await loadTwoShipLookups(releaseVersionOf(log))
  return readTwoShip(log, lookups)
}

export const twoShipFormat: LogFormat = {
  name: PORT,
  supported: SUPPORTED_VERSIONS,
  theme: THEME,
  recognizes,
  read,
}
