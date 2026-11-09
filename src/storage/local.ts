const PREFIX = 'lens.'

export function storageKey(name: string): string {
  return PREFIX + name
}

// Every call is guarded: storage can be missing, blocked or full
export function readItem(key: string): null | string {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Full or blocked: the value simply isn't remembered
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Blocked: nothing to remove
  }
}

export function clearAllState(): void {
  try {
    // Collect first: removing while indexing would skip keys
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith(PREFIX),
    )
    for (const key of keys) removeItem(key)
  } catch {
    // Blocked: nothing was stored
  }
}
