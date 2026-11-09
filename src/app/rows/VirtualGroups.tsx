import type { Range, Virtualizer } from '@tanstack/react-virtual'
import {
  defaultRangeExtractor,
  measureElement,
  useWindowVirtualizer,
} from '@tanstack/react-virtual'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  GROUP_GAP,
  HEADING_HEIGHT,
  ROW_HEIGHT,
} from '@/app/rows/utils/virtual-sizes'
import type { Row, RowGroup } from '@/model/seed'

import { GroupHeading } from './GroupHeading'

const OVERSCAN = 10

const PINNED_TOP = 'var(--bar-height,0px) + var(--head-height,0px)'

type Item =
  | { group: RowGroup; key: string; kind: 'row'; position: number; row: Row }
  | { key: string; kind: 'heading'; spaced: boolean; title: string }

function itemsOf(groups: RowGroup[]): Item[] {
  return groups.flatMap((group, groupIndex) => {
    const label = group.title ?? String(groupIndex)
    const heading: Item[] = group.title
      ? [
          {
            kind: 'heading',
            key: `heading|${label}`,
            title: group.title,
            spaced: groupIndex > 0,
          },
        ]
      : []
    // A row can sit in several groups, so its id alone isn't a key
    const rows = group.rows.map((row, position) => ({
      kind: 'row' as const,
      key: `${label}|${row.id}`,
      row,
      position,
      group,
    }))
    return [...heading, ...rows]
  })
}

function headingAt(headings: number[], index: number): number | undefined {
  let found: number | undefined
  for (const heading of headings) {
    if (heading > index) break
    found = heading
  }
  return found
}

function pageTop(element: HTMLElement | null): number {
  let top = 0
  for (let at = element; at; at = at.offsetParent as HTMLElement | null)
    top += at.offsetTop
  return top
}

function pinnedTop(list: HTMLElement): number {
  const style = getComputedStyle(list)
  const px = (name: string) => parseFloat(style.getPropertyValue(name)) || 0
  return px('--bar-height') + px('--head-height')
}

interface VirtualGroupsProps {
  groups: RowGroup[]
  renderRow: (row: Row, position: number, group: RowGroup) => ReactNode
}

// Unmounting a row loses only its hints' open state; ticks live elsewhere
export function VirtualGroups({ groups, renderRow }: VirtualGroupsProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)
  const [pinOffset, setPinOffset] = useState(0)
  const items = useMemo(() => itemsOf(groups), [groups])
  const headings = useMemo(
    () => items.flatMap((item, i) => (item.kind === 'heading' ? [i] : [])),
    [items],
  )

  // Re-measure when the page above the list resizes or wraps
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const list = listRef.current
      if (!list) return
      setScrollMargin(pageTop(list))
      setPinOffset(pinnedTop(list))
    })
    observer.observe(document.documentElement)
    return () => {
      observer.disconnect()
    }
  }, [])

  const rangeExtractor = useCallback(
    (range: Range) => {
      const pinned = headingAt(headings, range.startIndex)
      const indexes = new Set(defaultRangeExtractor(range))
      if (pinned !== undefined) indexes.add(pinned)
      return [...indexes].sort((a, b) => a - b)
    },
    [headings],
  )

  const estimateSize = useCallback(
    (i: number) => {
      const item = items[i]
      if (item?.kind !== 'heading') return ROW_HEIGHT
      return HEADING_HEIGHT + (item.spaced ? GROUP_GAP : 0)
    },
    [items],
  )
  const getItemKey = useCallback((i: number) => items[i]?.key ?? i, [items])
  // A hidden element measures 0, which would mount the whole list
  const measure = useCallback(
    (
      element: Element,
      entry: ResizeObserverEntry | undefined,
      instance: Virtualizer<Window, Element>,
    ) =>
      measureElement(element, entry, instance) ||
      estimateSize(instance.indexFromElement(element)),
    [estimateSize],
  )

  // The gap above a heading's text counts as clear, so it pins on its text
  const listStart = scrollMargin - pinOffset + GROUP_GAP

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize,
    getItemKey,
    measureElement: measure,
    overscan: OVERSCAN,
    scrollMargin: listStart,
    rangeExtractor,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const pinned = headingAt(headings, virtualizer.range?.startIndex ?? 0)

  return (
    <div
      className="relative"
      ref={listRef}
      role="list"
      style={{ height: virtualizer.getTotalSize() }}
    >
      {virtualItems.map((virtual) => {
        const item = items[virtual.index]
        if (!item) return null
        const sticky = virtual.index === pinned
        return (
          <div
            className={
              sticky
                ? 'sticky z-1 flow-root'
                : 'absolute top-0 left-0 flow-root w-full'
            }
            data-index={virtual.index}
            key={virtual.key}
            ref={virtualizer.measureElement}
            role={item.kind === 'row' ? 'listitem' : 'none'}
            style={
              sticky
                ? {
                    // Its gap above is padding, which would hang under the bars
                    top: `calc(${PINNED_TOP} - ${
                      item.kind === 'heading' && item.spaced ? GROUP_GAP : 0
                    }px)`,
                  }
                : {
                    transform: `translateY(${String(virtual.start - listStart)}px)`,
                  }
            }
          >
            {item.kind === 'heading' ? (
              <div className={item.spaced ? 'pt-6' : undefined}>
                <GroupHeading>{item.title}</GroupHeading>
              </div>
            ) : (
              renderRow(item.row, item.position, item.group)
            )}
          </div>
        )
      })}
    </div>
  )
}
