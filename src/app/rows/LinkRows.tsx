import { useCallback, useRef } from 'react'

import { usePinnedRow } from '@/app/rows/hooks/use-pinned-row'
import { InlineWalk } from '@/app/walk/InlineWalk'
import { SheetWalk } from '@/app/walk/SheetWalk'
import { startTrail } from '@/app/walk/utils/trail'
import { useWalk } from '@/app/walk/walk-context'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import type { Link, Place, RowGroup } from '@/model/seed'

import { LinkRow } from './LinkRow'
import { PlainRow } from './PlainRow'
import { RowGroups } from './RowGroups'

interface LinkRowsProps {
  groups: RowGroup[]
  places: Record<string, Place>
}

// Below this the list and the panel are too narrow to share the page
const INLINE_PANEL = '(min-width: 64rem)'

export function LinkRows({ groups, places }: LinkRowsProps) {
  const { trail, setTrail } = useWalk()
  const inline = useMediaQuery(INLINE_PANEL)
  const listRef = useRef<HTMLDivElement>(null)
  // The trail is already gone by the time the sheet hands focus back
  const startId = useRef<string | undefined>(undefined)
  const { rowElement, pinRow } = usePinnedRow(listRef)

  // Opening the panel narrows the list, which moves the row that was clicked
  const onSelect = useCallback(
    (link: Link) => {
      startId.current = link.id
      pinRow(link.id)
      setTrail(startTrail(link))
    },
    [pinRow, setTrail],
  )
  const closeWalk = useCallback(() => setTrail(null), [setTrail])
  const closeInline = useCallback(() => {
    pinRow(trail?.startId)
    rowElement(trail?.startId)?.focus({ preventScroll: true })
    setTrail(null)
  }, [pinRow, rowElement, setTrail, trail?.startId])
  const showInline = inline && trail !== null

  return (
    <div
      className={cn(
        showInline &&
          'grid grid-cols-[minmax(0,5fr)_minmax(0,4fr)] items-start gap-6',
      )}
    >
      <div className="min-w-0" ref={listRef}>
        <RowGroups
          groups={groups}
          renderRow={(row) =>
            row.kind === 'link' ? (
              <LinkRow
                link={row.link}
                onSelect={onSelect}
                selected={trail?.startId === row.id}
              />
            ) : (
              <PlainRow row={row} />
            )
          }
        />
      </div>
      {showInline ? (
        <InlineWalk onClose={closeInline} places={places} trail={trail} />
      ) : null}
      {inline ? null : (
        <SheetWalk
          onClose={closeWalk}
          onClosed={() => rowElement(startId.current)?.focus()}
          places={places}
          trail={trail}
        />
      )}
    </div>
  )
}
