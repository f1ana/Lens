import { memo } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import type { Row } from '@/model/seed'
import { revealKey } from '@/model/seed'

import { RowItem } from './RowItem'

interface ConcealedRowProps {
  // Tells the box from its neighbours, since the row's name is hidden
  label: string
  onToggle: (key: string) => void
  row: Row
  ticked: boolean
}

export const ConcealedRow = memo(function ConcealedRow({
  row,
  label,
  ticked,
  onToggle,
}: ConcealedRowProps) {
  return (
    <RowItem className="flex gap-3 px-3 py-2.5">
      <Checkbox
        aria-label={label}
        checked={ticked}
        className="mt-0.5"
        onCheckedChange={() => onToggle(revealKey(row))}
      />
      <div className="min-w-0 flex-1">
        {ticked ? (
          <>
            <span className="font-semibold break-words">{row.primary}</span>
            {row.secondary ? (
              <p className="text-sm break-words whitespace-pre-line text-muted-foreground">
                {row.secondary}
              </p>
            ) : null}
          </>
        ) : (
          <span className="text-muted-foreground italic">Hidden</span>
        )}
      </div>
    </RowItem>
  )
})
