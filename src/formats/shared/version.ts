export type Version = [number, number, number]

export function compareVersions(a: Version, b: Version): number {
  for (const [i, part] of a.entries()) {
    const other = b[i] ?? 0
    if (part !== other) return part - other
  }
  return 0
}

// e.g. 9.3.0–9.3.1
export function versionRange(minimum: Version, known: Version[]): string {
  const newest = known.reduce<Version>(
    (latest, version) =>
      compareVersions(version, latest) > 0 ? version : latest,
    minimum,
  )
  return compareVersions(newest, minimum) > 0
    ? `${minimum.join('.')}–${newest.join('.')}`
    : minimum.join('.')
}
