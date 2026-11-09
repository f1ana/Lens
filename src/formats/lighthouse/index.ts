import { checksDigest } from '@/formats/shared/digest'
import { otherDataSection, readSections } from '@/formats/shared/sections'
import type { GameTheme, LogFormat, OpenResult } from '@/model/seed'

import { SUPPORTED_VERSIONS } from './build'
import { checksSection, readChecks } from './checks'
import { loadLighthouseLookups } from './data-loader'
import { settingsSection, startingInventorySection } from './lists'
import type { LighthouseLookups } from './lookups'

const PORT = 'Lighthouse'
const THEME: GameTheme = 'lighthouse'

const MARKER = 'LIGHTHOUSE_RANDO_SPOILER'

const KNOWN_KEYS: ReadonlySet<string> = new Set([
  'type',
  'seed',
  'options',
  'checks',
  'loadout',
])

function recognizes(log: Record<string, unknown>): boolean {
  return (
    log.type === MARKER ||
    (Object.hasOwn(log, 'loadout') && Object.hasOwn(log, 'checks'))
  )
}

function titleOf(seed: unknown): string {
  if (typeof seed === 'number') return String(seed)
  if (typeof seed === 'string' && seed !== '') return seed
  return 'Unnamed seed'
}

export function readLighthouse(
  log: Record<string, unknown>,
  lookups: LighthouseLookups,
): OpenResult {
  const title = titleOf(log.seed)
  const checks = readChecks(log, lookups)

  return {
    status: 'opened',
    seed: {
      key: `LIGHTHOUSE|${title}|${checksDigest(log.checks)}`,
      title,
      subtitle: `Read as ${lookups.release}`,
      provenance: { port: PORT, theme: THEME, build: { kind: 'unrecorded' } },
      facts: [],
      details: [],
      checks,
      sections: readSections([
        {
          id: 'checks',
          title: 'Checks',
          read: () => checksSection(log, checks, lookups),
        },
        {
          id: 'settings',
          title: 'Settings',
          read: () => settingsSection(log, lookups),
        },
        {
          id: 'starting-inventory',
          title: 'Starting Inventory',
          read: () => startingInventorySection(log, lookups),
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

async function read(log: Record<string, unknown>): Promise<OpenResult> {
  return readLighthouse(log, await loadLighthouseLookups())
}

export const lighthouseFormat: LogFormat = {
  name: PORT,
  supported: SUPPORTED_VERSIONS,
  theme: THEME,
  recognizes,
  read,
}
