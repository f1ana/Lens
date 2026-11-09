import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { commitOf, githubSource } from '../lib/github-source.ts'
import {
  FILES,
  parseAreas,
  parseCheckTypes,
  parseEntrances,
  parseHashIcons,
  RANDOMIZER_DIR,
} from './parse.ts'

const REPO = 'HarbourMasters/Shipwright'

const tag = process.argv.at(2)
if (process.argv.length !== 3 || tag === undefined) {
  console.error('Usage: bun run generate:data <release tag>')
  process.exit(1)
}

const dataDir = resolve(import.meta.dirname, '../../src/formats/ship/data')
const releases = JSON.parse(
  readFileSync(join(dataDir, 'releases.json'), 'utf8'),
) as { commit: string; version: string }[]
const commit = commitOf(releases, tag, 'generate:releases')
const source = githubSource(REPO, commit)

const [
  util,
  checkObjects,
  miscEnums,
  entranceTable,
  tracker,
  types,
  hash,
  location,
] = await Promise.all([
  source.read(FILES.util),
  source.read(FILES.checkObjects),
  source.read(FILES.miscEnums),
  source.read(FILES.entranceTable),
  source.read(FILES.tracker),
  source.read(FILES.types),
  source.read(FILES.hash),
  source.read(FILES.location),
])
const randomizerFiles = (await source.list(RANDOMIZER_DIR))
  .filter((file) => file.endsWith('.cpp'))
  .sort()
const randomizerSources = await Promise.all(
  randomizerFiles.map((file) => source.read(`${RANDOMIZER_DIR}/${file}`)),
)

const areas = parseAreas(util, checkObjects, miscEnums)
const entrances = parseEntrances(entranceTable, tracker, miscEnums, types)
const hashIcons = parseHashIcons(hash)
const checkTypes = parseCheckTypes(util, miscEnums, location, randomizerSources)

const outDir = join(dataDir, tag)
mkdirSync(outDir, { recursive: true })
const write = (name: string, data: unknown) => {
  writeFileSync(join(outDir, name), `${JSON.stringify(data, null, 2)}\n`)
}
write('areas.json', areas)
write('entrances.json', entrances)
write('hash-icons.json', hashIcons)
write('check-types.json', checkTypes)
write('source.json', { shipwrightCommit: commit })

console.log(
  commit,
  areas.length,
  Object.keys(entrances).length,
  hashIcons.length,
  Object.keys(checkTypes).length,
)
