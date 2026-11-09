import { isRecord } from '@/lib/is-record'

import { readItem, storageKey, writeItem } from './local'

const GROUPINGS_KEY = storageKey('groupings')

export type GroupingChoices = Record<string, string>

function isChoices(value: unknown): value is GroupingChoices {
  return (
    isRecord(value) &&
    Object.values(value).every((id) => typeof id === 'string')
  )
}

export function loadGroupings(): GroupingChoices {
  const raw = readItem(GROUPINGS_KEY)
  if (raw === null) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    return isChoices(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function saveGroupings(choices: GroupingChoices): void {
  writeItem(GROUPINGS_KEY, JSON.stringify(choices))
}
