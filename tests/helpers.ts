import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { readTwoShip, twoShipFormat } from '@/formats/2ship'
import { lighthouseFormat, readLighthouse } from '@/formats/lighthouse'
import { readShip, shipFormat } from '@/formats/ship'
import type { Check, OpenResult, RowGroup, Section, Seed } from '@/model/seed'
import { hasRows } from '@/model/seed'

import { lookups as twoShipLookups } from './formats/2ship/data-5.0.1'
import { lookups as lighthouseLookups } from './formats/lighthouse/data-1.2.2'
import { lookups as shipLookups } from './formats/ship/data-9.3.1'

const FIXTURES = join(import.meta.dirname, 'fixtures', 'logs')

export function fixtureText(name: string): string {
  return readFileSync(join(FIXTURES, name), 'utf8')
}

export function fixtureFile(name: string): File {
  return new File([fixtureText(name)], name, { type: 'application/json' })
}

export async function upload(file: File): Promise<void> {
  await userEvent.upload(screen.getByLabelText('Open a spoiler log'), file)
}

export function fixture(name: string): Record<string, unknown> {
  return JSON.parse(fixtureText(name)) as Record<string, unknown>
}

function readNewest(log: Record<string, unknown>): OpenResult {
  if (shipFormat.recognizes(log)) return readShip(log, shipLookups)
  if (twoShipFormat.recognizes(log)) return readTwoShip(log, twoShipLookups)
  if (lighthouseFormat.recognizes(log))
    return readLighthouse(log, lighthouseLookups)
  throw new Error('No format recognizes this log')
}

export function open(name: string): { seed: Seed } {
  const result = readNewest(fixture(name))
  if (result.status !== 'opened')
    throw new Error(`${name} was rejected: ${result.message}`)
  return { seed: result.seed }
}

export function seedOf(result: OpenResult): Seed {
  if (result.status !== 'opened') throw new Error(`Rejected: ${result.message}`)
  return result.seed
}

export function sectionById(source: OpenResult | Seed, id: string): Section {
  const seed = 'status' in source ? seedOf(source) : source
  const section = seed.sections.find((s) => s.id === id)
  if (!section) throw new Error(`No section "${id}"`)
  return section
}

type Readable = Pick<Section, 'content'>

export function rowsOf(section: Readable | undefined): RowGroup[] {
  if (!section || !hasRows(section.content))
    throw new Error('The section has no rows')
  return section.content.groupings[0].groups
}

export function rowNames(section: null | Readable): string[] {
  if (!section) return []
  return rowsOf(section).flatMap((g) => g.rows.map((r) => r.primary))
}

export function sectionTitles(section: null | Readable): string[] {
  if (!section) return []
  return rowsOf(section).flatMap((g) => (g.title ? [g.title] : []))
}

export function rowCount(section: null | Readable): number {
  if (!section) return 0
  return rowsOf(section).reduce((total, g) => total + g.rows.length, 0)
}

export function checkNamed(seed: Seed, name: string): Check {
  const check = seed.checks.find((c) => c.name === name)
  if (!check) throw new Error(`No check "${name}"`)
  return check
}

export function checksHintedBy(seed: Seed, source: string): Check[] {
  return seed.checks.filter((c) => c.hints.some((h) => h.source === source))
}
