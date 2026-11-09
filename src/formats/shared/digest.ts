// FNV-1a over the checks, so a regenerated seed doesn't reuse old ticks
export function checksDigest(checks: unknown): string {
  let hash = 0x811c9dc5
  // JSON.stringify gives undefined for a missing value, despite its type
  const json = JSON.stringify(checks) as string | undefined
  for (const char of json ?? '') {
    hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193)
  }
  return (hash >>> 0).toString(16)
}
