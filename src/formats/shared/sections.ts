import type { Grouping, PlainRow, RowGroup, Section } from '@/model/seed'
import { FAILED_MESSAGE } from '@/model/seed'

export const PARTIAL_MESSAGE = 'Part of this section couldn’t be read.'

export type SectionBody = Omit<Section, 'id' | 'title'>

export interface SectionReader {
  id: string
  // Null when there is nothing to show; throwing fails only this section
  read: () => null | SectionBody
  title: string
}

export function readSections(readers: SectionReader[]): Section[] {
  return readers.flatMap(({ id, title, read }) => {
    try {
      const body = read()
      return body ? [{ id, title, ...body }] : []
    } catch {
      return [
        { id, title, content: { kind: 'failed', message: FAILED_MESSAGE } },
      ]
    }
  })
}

export function rowCount(groups: RowGroup[]): number {
  return groups.reduce((total, group) => total + group.rows.length, 0)
}

export function singleGrouping(groups: RowGroup[]): Grouping {
  return { id: 'all', label: 'All', groups }
}

export function display(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value)
}

export function rowsSection(rows: PlainRow[]): null | SectionBody {
  if (rows.length === 0) return null
  return {
    content: { kind: 'rows', groupings: [singleGrouping([{ rows }])] },
  }
}

export function listSection(values: unknown): null | SectionBody {
  if (values === undefined) return null
  if (!Array.isArray(values)) throw new Error('not a list')
  return rowsSection(
    (values as unknown[]).map((value, index) => ({
      kind: 'plain',
      id: String(index),
      primary: display(value),
    })),
  )
}

export function counted(section: null | SectionBody): null | SectionBody {
  if (section?.content.kind !== 'rows') return section
  const groups = section.content.groupings[0].groups
  return { ...section, count: rowCount(groups) }
}

export function otherDataSection(
  log: Record<string, unknown>,
  knownKeys: ReadonlySet<string>,
): null | SectionBody {
  const other = Object.entries(log).filter(([key]) => !knownKeys.has(key))
  if (other.length === 0) return null
  return {
    content: {
      kind: 'text',
      text: JSON.stringify(Object.fromEntries(other), null, 2),
    },
  }
}
