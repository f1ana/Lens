import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { openLogText } from '@/formats'

const dirs = (process.env.LENS_LOG_DIRS ?? 'tests/fixtures/logs').split(':')

function logFiles(directories: string[]): string[] {
  return directories.flatMap((dir) =>
    readdirSync(dir)
      .filter((name) => name.endsWith('.json'))
      .sort()
      .map((name) => join(dir, name)),
  )
}

// Avoids the code under test, so a broken version rule can't agree with itself
function versionOf(text: string): null | number[] {
  const raw = /"version"\s*:\s*"([^"]*)"/.exec(text)?.[1]
  const match = raw === undefined ? null : /\((\d+)\.(\d+)\.(\d+)\)/.exec(raw)
  return match ? match.slice(1).map(Number) : null
}

function isBefore(version: number[], minimum: number[]): boolean {
  for (const [i, part] of version.entries()) {
    const other = minimum[i] ?? 0
    if (part !== other) return part < other
  }
  return false
}

it.each(logFiles(dirs))(
  'reads %s or rejects it for its version',
  async (file) => {
    const text = readFileSync(file, 'utf8')
    const version = versionOf(text)
    const result = await openLogText(text)
    if (version && isBefore(version, [9, 3, 0])) {
      expect(result).toMatchObject({
        status: 'rejected',
        reason: 'unsupported-version',
      })
    } else {
      expect(result.status).toBe('opened')
      if (result.status === 'opened') {
        expect(
          result.seed.sections.every((s) => s.content.kind !== 'failed'),
        ).toBe(true)
        expect(result.seed.checks.length).toBeGreaterThan(0)
      }
    }
  },
)
