import type { RefObject } from 'react'
import { useCallback, useLayoutEffect, useRef } from 'react'

export function usePinnedRow(listRef: RefObject<HTMLElement | null>) {
  const pinned = useRef<null | { row: HTMLElement; top: number }>(null)

  const rowElement = useCallback(
    (id: string | undefined) => {
      const rows =
        listRef.current?.querySelectorAll<HTMLElement>('[data-row-id]')
      return Array.from(rows ?? []).find((row) => row.dataset.rowId === id)
    },
    [listRef],
  )

  const pinRow = useCallback(
    (id: string | undefined) => {
      const row = rowElement(id)
      pinned.current = row
        ? { row, top: row.getBoundingClientRect().top }
        : null
    },
    [rowElement],
  )

  useLayoutEffect(() => {
    if (!pinned.current) return
    const { row, top } = pinned.current
    pinned.current = null
    const moved = row.getBoundingClientRect().top - top
    if (moved !== 0) window.scrollBy(0, moved)
  })

  return { rowElement, pinRow }
}
