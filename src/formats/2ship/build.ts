import type { Version } from '@/formats/shared/version'
import { compareVersions, versionRange } from '@/formats/shared/version'
import type { Build } from '@/model/seed'

import releases from './data/releases.json'

export const MINIMUM_VERSION: Version = [5, 0, 1]

// 2Ship writes the first seven characters of the commit
const COMMIT = /^[0-9a-f]{7,40}$/

function parseVersion(version: string): null | Version {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version)
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

const known = releases.flatMap((release) => {
  const parsed = parseVersion(release.version)
  return parsed ? [{ ...release, parsed }] : []
})

export const SUPPORTED_VERSIONS = versionRange(
  MINIMUM_VERSION,
  known.map((release) => release.parsed),
)

function releaseOf(log: Record<string, unknown>) {
  const commit =
    typeof log.commitHash === 'string' ? log.commitHash.toLowerCase() : ''
  if (!COMMIT.test(commit)) return undefined
  return known.find((release) => release.commit.startsWith(commit))
}

export function releaseVersionOf(log: Record<string, unknown>): null | string {
  return releaseOf(log)?.version ?? null
}

export function olderRelease(log: Record<string, unknown>): null | string {
  const release = releaseOf(log)
  return release && compareVersions(release.parsed, MINIMUM_VERSION) < 0
    ? release.version
    : null
}

function supportedRelease(log: Record<string, unknown>) {
  const release = releaseOf(log)
  return release && compareVersions(release.parsed, MINIMUM_VERSION) >= 0
    ? release
    : undefined
}

// A log carries no version, so an unknown commit is unverified, not unofficial
export function identifyBuild(log: Record<string, unknown>): Build {
  const release = supportedRelease(log)
  return release
    ? { kind: 'official', release: release.version }
    : { kind: 'unverified' }
}

// e.g. Battler Bravo (5.0.1)
export function releaseName(log: Record<string, unknown>): null | string {
  const release = supportedRelease(log)
  return release ? `${release.name} (${release.version})` : null
}
