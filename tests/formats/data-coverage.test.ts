import { MINIMUM_VERSION as TWO_SHIP_MINIMUM } from '@/formats/2ship/build'
import twoShipReleases from '@/formats/2ship/data/releases.json'
import { MINIMUM_VERSION as LIGHTHOUSE_MINIMUM } from '@/formats/lighthouse/build'
import lighthouseReleases from '@/formats/lighthouse/data/releases.json'
import { compareVersions, type Version } from '@/formats/shared/version'
import shipReleases from '@/formats/ship/data/releases.json'
import { MINIMUM_VERSION as SHIP_MINIMUM } from '@/formats/ship/version'

// `required` mirrors the files data-loader.ts imports, plus source.json
const GAMES = [
  {
    name: 'Ship',
    minimum: SHIP_MINIMUM,
    releases: shipReleases,
    required: [
      'areas.json',
      'check-types.json',
      'entrances.json',
      'hash-icons.json',
      'source.json',
    ],
    files: Object.keys(import.meta.glob('/src/formats/ship/data/*/*.json')),
  },
  {
    name: '2Ship',
    minimum: TWO_SHIP_MINIMUM,
    releases: twoShipReleases,
    required: [
      'areas.json',
      'checks.json',
      'items.json',
      'options.json',
      'source.json',
    ],
    files: Object.keys(import.meta.glob('/src/formats/2ship/data/*/*.json')),
  },
  {
    name: 'Lighthouse',
    minimum: LIGHTHOUSE_MINIMUM,
    releases: lighthouseReleases,
    required: [
      'abilities.json',
      'checks.json',
      'items.json',
      'loadout.json',
      'options.json',
      'source.json',
      'types.json',
      'worlds.json',
    ],
    files: Object.keys(
      import.meta.glob('/src/formats/lighthouse/data/*/*.json'),
    ),
  },
]

const folderOf = (path: string) => path.split('/').at(-2)
const fileOf = (path: string) => path.split('/').at(-1)

function parse(release: string): Version {
  const [major = 0, minor = 0, patch = 0] = release.split('.').map(Number)
  return [major, minor, patch]
}

describe.each(GAMES)('$name reference data', (game) => {
  const present = (release: string) =>
    new Set(
      game.files
        .filter((path) => folderOf(path) === release)
        .map((path) => fileOf(path)),
    )

  it('every release at or above the minimum has every data file', () => {
    const missing = game.releases
      .map(({ version }) => version)
      .filter((version) => compareVersions(parse(version), game.minimum) >= 0)
      .flatMap((version) => {
        const held = present(version)
        return game.required
          .filter((file) => !held.has(file))
          .map((file) => `${version} is missing ${file}`)
      })
    expect(missing).toEqual([])
  })

  it('no data folder is missing its source.json', () => {
    const without = [...new Set(game.files.map(folderOf))].filter(
      (folder) => folder !== undefined && !present(folder).has('source.json'),
    )
    expect(without).toEqual([])
  })
})
