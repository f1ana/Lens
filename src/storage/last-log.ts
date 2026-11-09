import { isRecord } from '@/lib/is-record'

import { readItem, removeItem, storageKey, writeItem } from './local'

const LOG_KEY = storageKey('lastLog')
const TICKS_KEY = storageKey('ticks')

interface StoredTicks {
  checkIds: string[]
  seedKey: string
}

function isStoredTicks(value: unknown): value is StoredTicks {
  return (
    isRecord(value) &&
    typeof value.seedKey === 'string' &&
    Array.isArray(value.checkIds) &&
    value.checkIds.every((id) => typeof id === 'string')
  )
}

export function saveLastLog(text: string): void {
  writeItem(LOG_KEY, text)
}

export function loadLastLog(): null | string {
  return readItem(LOG_KEY)
}

export function clearLastLog(): void {
  removeItem(LOG_KEY)
  removeItem(TICKS_KEY)
}

export function saveTicks(seedKey: string, checkIds: string[]): void {
  const stored: StoredTicks = { seedKey, checkIds }
  writeItem(TICKS_KEY, JSON.stringify(stored))
}

export function loadTicks(seedKey: string): string[] {
  const raw = readItem(TICKS_KEY)
  if (raw === null) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!isStoredTicks(parsed) || parsed.seedKey !== seedKey) return []
  return parsed.checkIds
}
