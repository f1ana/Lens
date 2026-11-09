import { compareVersions, type Version } from './version'

export class DataLoadError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'DataLoadError'
  }
}

function parseRelease(release: string): null | Version {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(release)
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null
}

export function chooseRelease(
  wanted: null | string,
  held: readonly string[],
): string {
  if (wanted !== null && held.includes(wanted)) return wanted
  let newest: null | { release: string; version: Version } = null
  for (const release of held) {
    const version = parseRelease(release)
    if (!version) continue
    if (!newest || compareVersions(version, newest.version) > 0) {
      newest = { release, version }
    }
  }
  if (!newest) throw new DataLoadError('No reference data is available')
  return newest.release
}

// As import.meta.glob gives them: a dynamic import per path
export type ReleaseFiles<T> = {
  [K in keyof T]: Record<string, () => Promise<T[K]>>
}

const FOLDER = /\/data\/([^/]+)\/[^/]+$/

function byRelease<V>(
  imports: Record<string, () => Promise<V>>,
): Map<string, () => Promise<V>> {
  return new Map(
    Object.entries(imports).flatMap(([path, load]) => {
      const release = FOLDER.exec(path)?.[1]
      return release === undefined ? [] : [[release, load] as const]
    }),
  )
}

function isAtLeast(release: string, minimum: Version): boolean {
  const version = parseRelease(release)
  return version !== null && compareVersions(version, minimum) >= 0
}

// A release counts as held only at or above the minimum, with every file
export async function loadRelease<T extends object>(
  wanted: null | string,
  minimum: Version,
  files: ReleaseFiles<T>,
): Promise<T> {
  const names = Object.keys(files) as (keyof T)[]
  const tables = names.map((name) => byRelease(files[name]))
  const held = [...(tables[0]?.keys() ?? [])].filter(
    (release) =>
      isAtLeast(release, minimum) && tables.every((t) => t.has(release)),
  )
  const release = chooseRelease(wanted, held)
  try {
    const loaded = await Promise.all(
      tables.map((table) => {
        // Unreachable: a release is held only when every file is there
        const load = table.get(release)
        if (!load) throw new Error(`A file is missing from ${release}`)
        return load()
      }),
    )
    return Object.fromEntries(names.map((name, i) => [name, loaded[i]])) as T
  } catch (error) {
    throw new DataLoadError(
      `The reference data for ${release} couldn’t be loaded`,
      { cause: error },
    )
  }
}
