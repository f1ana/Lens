import type { SectionBody } from '@/formats/shared/sections'
import { display, singleGrouping } from '@/formats/shared/sections'
import { isRecord } from '@/lib/is-record'
import type { PlainRow, RowGroup } from '@/model/seed'

import type { LighthouseLookups } from './lookups'

export function settingsSection(
  log: Record<string, unknown>,
  lookups: LighthouseLookups,
): null | SectionBody {
  const { options } = log
  if (options === undefined) return null
  if (!isRecord(options)) throw new Error('options is not an object')
  const rows = Object.entries(options).map(([code, value]): PlainRow => {
    const option = lookups.options.get(code)
    const raw = display(value)
    // Only the option's own value names: a log can write "__proto__"
    const named =
      option && Object.hasOwn(option.values, raw)
        ? option.values[raw]
        : undefined
    return {
      kind: 'plain',
      id: code,
      primary: option?.label ?? code,
      secondary: named ?? raw,
    }
  })
  if (rows.length === 0) return null
  return { content: { kind: 'rows', groupings: [singleGrouping([{ rows }])] } }
}

function loadoutGroup(
  title: string,
  values: unknown,
  nameOf: (n: number) => string | undefined,
): RowGroup[] {
  if (values === undefined) return []
  if (!Array.isArray(values)) throw new Error(`${title} is not a list`)
  const rows = (values as unknown[]).map((value, index): PlainRow => ({
    kind: 'plain',
    id: `${title}|${String(index)}`,
    primary:
      (typeof value === 'number' ? nameOf(value) : undefined) ?? display(value),
  }))
  return rows.length > 0 ? [{ title, rows }] : []
}

export function startingInventorySection(
  log: Record<string, unknown>,
  lookups: LighthouseLookups,
): null | SectionBody {
  const { loadout } = log
  if (loadout === undefined) return null
  if (!isRecord(loadout)) throw new Error('loadout is not an object')
  const groups = [
    ...loadoutGroup('Abilities', loadout.abilities, (n) =>
      lookups.loadoutAbility(n),
    ),
    ...loadoutGroup('Items', loadout.items, (n) => lookups.loadoutItem(n)),
  ]
  if (groups.length === 0) return null
  return {
    count: groups.reduce((total, group) => total + group.rows.length, 0),
    content: { kind: 'rows', groupings: [singleGrouping(groups)] },
  }
}
