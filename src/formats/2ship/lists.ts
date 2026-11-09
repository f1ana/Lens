import type { SectionBody } from '@/formats/shared/sections'
import {
  counted,
  display,
  listSection,
  singleGrouping,
} from '@/formats/shared/sections'
import { isRecord } from '@/lib/is-record'
import type { PlainRow, RowGroup } from '@/model/seed'

import type { OptionData, TwoShipLookups } from './lookups'
import { readableName } from './lookups'

const UNKNOWN_GROUP = 'General'
const GROUPS = [
  'General',
  'Access',
  'Time',
  'Item Placement',
  'Shuffle',
  'Starting',
  'Hints',
]

function clock(minutes: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
}

function settingValue(
  code: string,
  option: OptionData,
  value: unknown,
  lookups: TwoShipLookups,
): string {
  switch (option.kind) {
    case 'toggle':
      return value === 0 ? 'Off' : 'On'
    case 'choice':
      return lookups.choices.get(code)?.get(String(value)) ?? display(value)
    case 'time':
      return typeof value === 'number' ? clock(value) : display(value)
    case 'number':
      return display(value)
  }
}

function settingRow(
  code: string,
  value: unknown,
  lookups: TwoShipLookups,
): [string, PlainRow] {
  const option = lookups.options.get(code)
  return [
    option?.group ?? UNKNOWN_GROUP,
    {
      kind: 'plain',
      id: code,
      primary: option?.label ?? readableName(code, 'RO_'),
      secondary: option
        ? settingValue(code, option, value, lookups)
        : display(value),
    },
  ]
}

export function settingsSection(
  log: Record<string, unknown>,
  lookups: TwoShipLookups,
): null | SectionBody {
  const { options: settings } = log
  if (settings === undefined) return null
  if (!isRecord(settings)) throw new Error('options is not an object')
  const rows = Object.entries(settings).map(([code, value]) =>
    settingRow(code, value, lookups),
  )
  const groups: RowGroup[] = GROUPS.flatMap((title) => {
    const inGroup = rows.filter(([group]) => group === title)
    return inGroup.length > 0
      ? [{ title, rows: inGroup.map(([, row]) => row) }]
      : []
  })
  if (groups.length === 0) return null
  return { content: { kind: 'rows', groupings: [singleGrouping(groups)] } }
}

export function itemListSection(
  values: unknown,
  lookups: TwoShipLookups,
): null | SectionBody {
  const named = Array.isArray(values)
    ? (values as unknown[]).map((value) =>
        typeof value === 'string' ? lookups.itemName(value) : value,
      )
    : values
  return counted(listSection(named))
}
