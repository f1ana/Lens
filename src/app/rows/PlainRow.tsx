import type { Row } from '@/model/seed'

import { RowItem } from './RowItem'

export function PlainRow({ row }: { row: Row }) {
  return (
    <RowItem className="px-3 py-2.5">
      <span className="font-semibold break-words">{row.primary}</span>
      {row.secondary ? (
        <p className="text-sm break-words whitespace-pre-line text-muted-foreground">
          {row.secondary}
        </p>
      ) : null}
    </RowItem>
  )
}
