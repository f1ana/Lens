import type { Version } from '@/formats/shared/version'
import { compareVersions, versionRange } from '@/formats/shared/version'
import type { Build } from '@/model/seed'

import releases from './data/releases.json'
import { MINIMUM_VERSION, parseVersion } from './version'

// Ship writes the first seven characters of the commit
const COMMIT = /^[0-9a-f]{7,40}$/

const known = releases.map((release) => ({
  ...release,
  parsed: parseVersion(`(${release.version})`),
}))

const newestKnown = known
  .flatMap((release) => (release.parsed ? [release.parsed] : []))
  .reduce<null | Version>(
    (newest, version) =>
      newest === null || compareVersions(version, newest) > 0
        ? version
        : newest,
    null,
  )

export const SUPPORTED_VERSIONS = versionRange(
  MINIMUM_VERSION,
  known.flatMap((release) => (release.parsed ? [release.parsed] : [])),
)

// Catches release builds only, not an edited log or a modified release build
export function identifyBuild(log: Record<string, unknown>): Build {
  const commit =
    typeof log.git_commit === 'string' ? log.git_commit.toLowerCase() : ''
  if (!COMMIT.test(commit)) return { kind: 'unverified' }

  const version = parseVersion(log.version)
  const release = known.find((r) => r.commit.startsWith(commit))
  if (release) {
    return version &&
      release.parsed &&
      compareVersions(version, release.parsed) === 0
      ? { kind: 'official', release: release.version }
      : { kind: 'unofficial' }
  }

  // Unofficial only if Lens knows every release the version could be
  const beyondKnown =
    !version || !newestKnown || compareVersions(version, newestKnown) > 0
  return beyondKnown ? { kind: 'unverified' } : { kind: 'unofficial' }
}
