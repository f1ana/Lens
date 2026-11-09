import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import {
  compareVersions,
  type Version,
} from '../../src/formats/shared/version.ts'

interface ListedRelease {
  isDraft: boolean
  isPrerelease: boolean
  name: string
  tagName: string
}

const gh = (...args: string[]): string =>
  execFileSync('gh', args, { encoding: 'utf8' })

function stableVersion(release: ListedRelease): null | Version {
  if (release.isDraft || release.isPrerelease) return null
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(release.tagName)
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

export function listStableReleases(
  repo: string,
): { commit: string; name: string; version: Version }[] {
  const listed = JSON.parse(
    gh(
      'release',
      'list',
      '--repo',
      repo,
      '--limit',
      '200',
      '--json',
      'tagName,name,isDraft,isPrerelease',
    ),
  ) as ListedRelease[]

  return listed
    .flatMap((release) => {
      const version = stableVersion(release)
      return version ? [{ release, version }] : []
    })
    .sort((a, b) => compareVersions(a.version, b.version))
    .map(({ release, version }) => ({
      version,
      // "Dewey Bravo 9.3.1" is the codename followed by the version
      name: release.name.replace(/\s*\d+\.\d+\.\d+$/, ''),
      // The commits endpoint follows annotated tags down to the commit
      commit: gh(
        'api',
        `repos/${repo}/commits/${release.tagName}`,
        '--jq',
        '.sha',
      ).trim(),
    }))
}

export function writeReleaseList(
  repo: string,
  game: string,
  keep: (version: Version) => boolean = () => true,
): void {
  const releases = listStableReleases(repo)
    .filter((release) => keep(release.version))
    .map((release) => ({ ...release, version: release.version.join('.') }))

  if (releases.length === 0) {
    console.error('GitHub listed no stable releases')
    process.exit(1)
  }

  const outDir = resolve(import.meta.dirname, `../../src/formats/${game}/data`)
  writeFileSync(
    join(outDir, 'releases.json'),
    `${JSON.stringify(releases, null, 2)}\n`,
  )

  console.log(
    releases.map((r) => `${r.version} ${r.commit.slice(0, 7)}`).join('\n'),
  )
}
