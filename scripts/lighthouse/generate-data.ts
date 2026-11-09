import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import type { LighthouseData } from '../../src/formats/lighthouse/lookups.ts'
import { commitOf, githubSource } from '../lib/github-source.ts'
import {
  FILES,
  parseAbilityNames,
  parseChecks,
  parseItems,
  parseLoadout,
  parseOptions,
  parseTypes,
  parseWorlds,
} from './parse.ts'

const REPO = 'HarbourMasters/Lighthouse'

const tag = process.argv.at(2)
if (process.argv.length !== 3 || tag === undefined) {
  console.error('Usage: bun run generate:lighthouse-data <release tag>')
  process.exit(1)
}

const dataDir = resolve(
  import.meta.dirname,
  '../../src/formats/lighthouse/data',
)
const releases = JSON.parse(
  readFileSync(join(dataDir, 'releases.json'), 'utf8'),
) as { commit: string; version: string }[]
const commit = commitOf(releases, tag, 'generate:lighthouse-releases')
const source = githubSource(REPO, commit)

const [
  types,
  checksCpp,
  itemsCpp,
  optionsCpp,
  menu,
  saveData,
  shipUtils,
  pauseMenu,
  abilityH,
  enumsH,
] = await Promise.all(
  [
    FILES.types,
    FILES.checks,
    FILES.items,
    FILES.options,
    FILES.menu,
    FILES.saveData,
    FILES.shipUtils,
    FILES.pauseMenu,
    FILES.abilities,
    FILES.enums,
  ].map((path) => source.read(path)),
)

const worlds = parseWorlds(pauseMenu)
const checkTypes = parseTypes(types)
const data: LighthouseData = {
  abilities: parseAbilityNames(shipUtils),
  checks: parseChecks(checksCpp, types, shipUtils, worlds, checkTypes),
  items: parseItems(itemsCpp, types),
  loadout: parseLoadout(saveData, abilityH, enumsH),
  options: parseOptions(optionsCpp, types, menu),
  source: { commit, release: tag },
  types: checkTypes.map(({ name }) => name),
  worlds: [...worlds.values()],
}

const outDir = join(dataDir, tag)
mkdirSync(outDir, { recursive: true })
for (const [name, value] of Object.entries(data)) {
  writeFileSync(
    join(outDir, `${name}.json`),
    `${JSON.stringify(value, null, 2)}\n`,
  )
}

console.log(
  commit,
  data.checks.length,
  Object.keys(data.items).length,
  Object.keys(data.options).length,
  data.worlds.length,
  data.types.length,
)
