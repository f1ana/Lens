import { compareVersions, type Version } from '../shared/version.ts'

export const MINIMUM_VERSION: Version = [9, 3, 0]

export function parseVersion(version: unknown): null | Version {
  if (typeof version !== 'string') return null
  const match = /\((\d+)\.(\d+)\.(\d+)\)/.exec(version)
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

export function isBelowMinimum(version: Version): boolean {
  return compareVersions(version, MINIMUM_VERSION) < 0
}
