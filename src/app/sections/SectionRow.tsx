import { CheckRow } from '@/app/rows/CheckRow'
import { ConcealedRow } from '@/app/rows/ConcealedRow'
import { PlainRow } from '@/app/rows/PlainRow'
import { useReveals } from '@/app/seed/seed-view-context'
import type { Row, RowGroup } from '@/model/seed'
import { isConcealed, revealKey } from '@/model/seed'

function revealLabel(row: Row, position: number, group: RowGroup): string {
  const noun = row.kind === 'concealed' ? 'hint' : 'check'
  const where = group.title ? ` in ${group.title}` : ''
  return `Reveal ${noun} ${position + 1}${where}`
}

export function SectionRow({
  row,
  position,
  group,
}: {
  group: RowGroup
  position: number
  row: Row
}) {
  const { checks, ticked, onToggle } = useReveals()
  const check = 'checkId' in row ? checks.get(row.checkId) : undefined
  const revealed = ticked.has(revealKey(row))

  if (isConcealed(row) && !(check && revealed))
    return (
      <ConcealedRow
        label={revealLabel(row, position, group)}
        onToggle={onToggle}
        row={row}
        ticked={revealed}
      />
    )
  return check ? (
    <CheckRow check={check} onToggle={onToggle} ticked={revealed} />
  ) : (
    <PlainRow row={row} />
  )
}
