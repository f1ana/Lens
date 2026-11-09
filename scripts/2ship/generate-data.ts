import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { commitOf, githubSource } from '../lib/github-source.ts'
import {
  checkRows,
  FILES,
  parseChecks,
  parseCheckTypeLabels,
  parseItems,
  parseOptions,
  parseRegions,
  parseScenes,
  REGIONS_DIR,
  resolveAreas,
} from './parse.ts'

const REPO = '2ship2harkinian/2ship2harkinian'

const tag = process.argv.at(2)
if (process.argv.length !== 3 || tag === undefined) {
  console.error('Usage: bun run generate:2ship-data <release tag>')
  process.exit(1)
}

const dataDir = resolve(import.meta.dirname, '../../src/formats/2ship/data')
const releases = JSON.parse(
  readFileSync(join(dataDir, 'releases.json'), 'utf8'),
) as { commit: string; version: string }[]
const commit = commitOf(releases, tag, 'generate:2ship-releases')
const source = githubSource(REPO, commit)

const [types, menu, checksCpp, itemsCpp, optionsCpp, sceneTable] =
  await Promise.all([
    source.read(FILES.types),
    source.read(FILES.menu),
    source.read(FILES.checks),
    source.read(FILES.items),
    source.read(FILES.options),
    source.read(FILES.sceneTable),
  ])
const regionFiles = (await source.list(REGIONS_DIR))
  .filter((file) => file.endsWith('.cpp'))
  .sort()
const regionSources = await Promise.all(
  regionFiles.map((file) => source.read(`${REGIONS_DIR}/${file}`)),
)

const tableChecks = parseChecks(checksCpp)
const { areas, byCheck } = resolveAreas({
  regions: parseRegions(regionSources, types),
  scenes: parseScenes(sceneTable),
  checks: tableChecks,
})
const checks = checkRows(
  tableChecks,
  byCheck,
  parseCheckTypeLabels(menu),
  types,
)
const items = parseItems(itemsCpp)
const options = parseOptions(optionsCpp, menu, types)

const outDir = join(dataDir, tag)
mkdirSync(outDir, { recursive: true })
const write = (name: string, data: unknown) => {
  writeFileSync(join(outDir, name), `${JSON.stringify(data, null, 2)}\n`)
}
write('checks.json', checks)
write('items.json', items)
write('options.json', options)
write('areas.json', areas)
write('source.json', { twoShipCommit: commit })

console.log(
  commit,
  checks.length,
  Object.keys(items).length,
  Object.keys(options).length,
  areas.length,
)
