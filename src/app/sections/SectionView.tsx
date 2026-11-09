import { useId, useMemo, useRef } from 'react'

import { useChoices } from '@/app/seed/seed-view-context'
import { useHeightVar } from '@/hooks/use-height-var'
import type { Section } from '@/model/seed'
import { hasRows } from '@/model/seed'

import { GroupFilter } from './GroupFilter'
import { GroupSelect } from './GroupSelect'
import { SectionBody } from './SectionBody'

export function SectionView({ section }: { section: Section }) {
  const headingId = useId()
  const headRef = useRef<HTMLDivElement>(null)
  // Group headings pin below this header
  useHeightVar(headRef, '--head-height')
  const { groupings, groupTitles, onGroupingChange, onGroupTitleChange } =
    useChoices()

  const { id, title, note, content } = section
  const arrangements = hasRows(content) ? content.groupings : undefined
  // A remembered choice can name an arrangement this log doesn't offer
  const grouping =
    arrangements?.find((g) => g.id === groupings[id]) ?? arrangements?.[0]
  const titles = grouping?.groups.flatMap((g) => g.title ?? [])
  const shownTitle = titles?.find((t) => t === groupTitles[id])
  const groups = useMemo(
    () =>
      grouping?.groups.filter(
        (g) => shownTitle === undefined || g.title === shownTitle,
      ) ?? [],
    [grouping, shownTitle],
  )

  return (
    <section
      aria-labelledby={headingId}
      // Keeps focused rows clear of what is pinned above
      className="[&_button]:scroll-mt-[calc(var(--bar-height,0px)+var(--head-height,0px)+3rem)]"
    >
      <div
        className="sticky top-[var(--bar-height,0px)] z-2 -mx-3 flex flex-col gap-1 border-b border-border bg-background/90 px-3 pt-1 pb-2 backdrop-blur"
        ref={headRef}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h2 className="text-lg font-semibold" id={headingId}>
            {title}
          </h2>
          {arrangements && grouping && titles ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {arrangements.length > 1 ? (
                <GroupSelect
                  groupings={arrangements}
                  onValueChange={(groupingId) =>
                    onGroupingChange(id, groupingId)
                  }
                  value={grouping.id}
                />
              ) : null}
              {titles.length > 1 ? (
                <GroupFilter
                  onValueChange={(t) => onGroupTitleChange(id, t)}
                  titles={titles}
                  value={shownTitle}
                />
              ) : null}
            </div>
          ) : null}
        </div>
        {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
      </div>
      <div className="mt-2">
        <SectionBody content={content} groups={groups} />
      </div>
    </section>
  )
}
