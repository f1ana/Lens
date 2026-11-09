import type { Version } from '@/formats/shared/version'
import { versionRange } from '@/formats/shared/version'

import releases from './data/releases.json'

// Logs record no version, so this only bounds the data Lens holds
export const MINIMUM_VERSION: Version = [1, 2, 2]

function parseVersion(version: string): null | Version {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version)
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

export const SUPPORTED_VERSIONS = versionRange(
  MINIMUM_VERSION,
  releases.flatMap((release) => {
    const parsed = parseVersion(release.version)
    return parsed ? [parsed] : []
  }),
)
