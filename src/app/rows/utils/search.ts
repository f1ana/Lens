import type { Check, RowGroup } from '@/model/seed'
import { isConcealed, revealKey } from '@/model/seed'

// Logs spell the same name with and without an apostrophe
function normalize(text: string): string {
  return text.toLowerCase().replace(/['’]/g, '')
}

function wordsOf(query: string): string[] {
  return normalize(query).split(/\s+/).filter(Boolean)
}

function hasWords(text: string, words: string[]): boolean {
  const normalized = normalize(text)
  return words.every((word) => normalized.includes(word))
}

export function matchesText(text: string, query: string): boolean {
  return hasWords(text, wordsOf(query))
}

export function filterRows(
  groups: RowGroup[],
  checks: Map<string, Check>,
  query: string,
  ticked: ReadonlySet<string>,
): RowGroup[] {
  const words = wordsOf(query)
  if (words.length === 0) return groups

  return groups.flatMap((group) => {
    const rows = group.rows.filter((row) => {
      if (isConcealed(row) && !ticked.has(revealKey(row))) return false
      const check = 'checkId' in row ? checks.get(row.checkId) : undefined
      return hasWords(
        [row.primary, row.secondary, row.searchText, check?.searchText].join(
          ' ',
        ),
        words,
      )
    })
    return rows.length > 0 ? [{ ...group, rows }] : []
  })
}
