import { Buckets } from '@/formats/shared/buckets'
import type { SectionBody } from '@/formats/shared/sections'
import { PARTIAL_MESSAGE, rowCount } from '@/formats/shared/sections'
import { isRecord } from '@/lib/is-record'
import type { Check, ConcealedRow, HintRef } from '@/model/seed'

import { WORKED_OUT_HINTS } from './static-hints'

export const HINT_NOTE =
  'Only the hints in this log are listed, so this is not a complete list.'

const NO_TEXT = 'No text'
const DESTINATION_SUFFIX = ' Destination'

const GOSSIP_GROUPS = {
  WotH: 'Way of the Hero hints',
  Foolish: 'Foolish hints',
} as const
const OTHER_GOSSIP_GROUP = 'Gossip stone hints'
const STATIC_GROUP = 'Static hints'
const WARP_GROUP = 'Warp song destinations'

// Strips control characters except line breaks; @ is the player's name
export function cleanHintText(text: string): string {
  return text.replace(/[^\P{Cc}\n]/gu, '').replaceAll('@', 'Link')
}

function hintMessage(hint: Record<string, unknown>): null | string {
  const { message, messages } = hint
  if (typeof message === 'string') return cleanHintText(message)
  if (Array.isArray(messages)) {
    const parts = (messages as unknown[])
      .filter((part): part is string => typeof part === 'string')
      .map(cleanHintText)
    // One message per place the game gives the hint, and they can read the same
    if (parts.length > 0) return [...new Set(parts)].join('\n\n')
  }
  return null
}

function groupRows(
  section: string,
  hints: Record<string, unknown>,
  groupOf: (name: string, hint: Record<string, unknown>) => string,
  byType: Buckets,
): void {
  for (const [name, value] of Object.entries(hints)) {
    const hint = isRecord(value) ? value : {}
    // The name gives away where the hint is told
    const row: ConcealedRow = {
      kind: 'concealed',
      id: `${section}|${name}`,
      primary: name,
      secondary: hintMessage(hint) ?? NO_TEXT,
    }
    byType.add(groupOf(name, hint), row)
  }
}

function gossipGroup(_name: string, hint: Record<string, unknown>): string {
  const { distribution } = hint
  if (
    typeof distribution === 'string' &&
    Object.hasOwn(GOSSIP_GROUPS, distribution)
  )
    return GOSSIP_GROUPS[distribution as keyof typeof GOSSIP_GROUPS]
  return OTHER_GOSSIP_GROUP
}

function staticGroup(name: string): string {
  return name.endsWith(DESTINATION_SUFFIX) ? WARP_GROUP : STATIC_GROUP
}

export function hintsSection(log: Record<string, unknown>): null | SectionBody {
  const gossip = log['Gossip Stone Hints']
  const statics = log['Static Hints']
  // Ship leaves a key out when it has no hints, so any other shape is damage
  const damaged = [gossip, statics].some(
    (hints) => hints !== undefined && !isRecord(hints),
  )

  const byType = new Buckets()
  if (isRecord(gossip)) groupRows('gossip', gossip, gossipGroup, byType)
  if (isRecord(statics)) groupRows('static', statics, staticGroup, byType)

  const groups = byType.groups([
    GOSSIP_GROUPS.WotH,
    GOSSIP_GROUPS.Foolish,
    OTHER_GOSSIP_GROUP,
    STATIC_GROUP,
    WARP_GROUP,
  ])
  if (groups.length === 0) {
    if (damaged) throw new Error('hints are not objects')
    return null
  }

  return {
    note: damaged ? `${PARTIAL_MESSAGE} ${HINT_NOTE}` : HINT_NOTE,
    count: rowCount(groups),
    spoilerCount: true,
    content: {
      kind: 'rows',
      // Not by area: a heading would say where each hidden hint is told
      groupings: [{ id: 'type', label: 'Type', groups }],
    },
  }
}

function targetsOf(hint: Record<string, unknown>): string[] {
  const targets: string[] = []
  if (typeof hint.location === 'string') targets.push(hint.location)
  if (Array.isArray(hint.locations))
    for (const location of hint.locations as unknown[])
      if (typeof location === 'string') targets.push(location)
  return targets
}

function addRef(check: Check | undefined, ref: HintRef): void {
  if (!check || check.hints.some((existing) => existing.source === ref.source))
    return
  check.hints.push(ref)
}

function attachLogged(hints: unknown, byName: Map<string, Check>): void {
  if (!isRecord(hints)) return
  for (const [name, value] of Object.entries(hints)) {
    if (!isRecord(value)) continue
    const ref: HintRef = {
      source: name,
      text: hintMessage(value) ?? NO_TEXT,
    }
    for (const target of targetsOf(value)) addRef(byName.get(target), ref)
  }
}

export function attachHints(
  log: Record<string, unknown>,
  checks: Check[],
): void {
  const byName = new Map(checks.map((check) => [check.name, check]))
  attachLogged(log['Gossip Stone Hints'], byName)
  attachLogged(log['Static Hints'], byName)

  const { settings } = log
  if (!isRecord(settings)) return
  for (const hint of WORKED_OUT_HINTS) {
    if (settings[hint.setting] !== 'On') continue
    const ref: HintRef = {
      source: `${hint.label} hint`,
      text: `The ${hint.label} hint points here`,
    }
    for (const name of hint.checks) addRef(byName.get(name), ref)
  }
}
