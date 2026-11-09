import type { RefObject } from 'react'
import { useRef, useState } from 'react'

import { ErrorBoundary } from '@/app/ErrorBoundary'
import { Notice } from '@/app/shared/Notice'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import type { Section } from '@/model/seed'
import { FAILED_MESSAGE } from '@/model/seed'

import { SectionView } from './SectionView'

const HIDDEN_COUNT = '??'
// Tailwind's md breakpoint, where the sections move to the side
const WIDE_SCREEN = '(min-width: 48rem)'

function scrollToContent(
  content: HTMLElement | null,
  bar: HTMLElement | null,
): void {
  if (!content || !bar) return
  const offset = content.getBoundingClientRect().top - bar.offsetHeight
  if (offset < 0) window.scrollBy(0, offset)
}

interface SectionTabsProps {
  barRef: RefObject<HTMLElement | null>
  hideSpoilerCounts: boolean
  sections: Section[]
  // The search hasn't caught up with the typing
  stale: boolean
}

export function SectionTabs({
  sections,
  barRef,
  hideSpoilerCounts,
  stale,
}: SectionTabsProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [activeId, setActiveId] = useState(sections[0]?.id)
  const active = sections.find((s) => s.id === activeId) ?? sections[0]
  const wide = useMediaQuery(WIDE_SCREEN)

  return (
    <Tabs
      // Arrowing past a section must not open it: Hints stay unread until chosen
      activationMode="manual"
      className="gap-4 pt-4 md:gap-8"
      onValueChange={setActiveId}
      orientation={wide ? 'vertical' : 'horizontal'}
      ref={contentRef}
      value={active?.id}
    >
      <TabsList
        aria-label="Sections"
        className="w-full justify-start overflow-x-auto p-1 pb-2 group-data-horizontal/tabs:h-auto md:sticky md:top-[calc(var(--bar-height,0px)+1rem)] md:w-52 md:shrink-0 md:self-start md:overflow-visible md:border-r md:border-border md:pr-1 md:pb-1"
        variant="line"
      >
        {sections.map((section) => (
          <TabsTrigger
            className="flex-none gap-3 px-2.5 py-1.5"
            key={section.id}
            onClick={() => scrollToContent(contentRef.current, barRef.current)}
            value={section.id}
          >
            <span>{section.title}</span>
            {section.count === undefined ? null : (
              <span className="ml-auto text-xs font-normal tabular-nums">
                {section.spoilerCount && hideSpoilerCounts
                  ? HIDDEN_COUNT
                  : section.count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {sections.map((section) => (
        <TabsContent
          className={cn(
            'min-w-0 rounded-md text-base transition-opacity focus-visible:ring-3 focus-visible:ring-ring/50',
            stale && 'opacity-60',
          )}
          key={section.id}
          value={section.id}
        >
          <ErrorBoundary fallback={<Notice message={FAILED_MESSAGE} />}>
            <SectionView section={section} />
          </ErrorBoundary>
        </TabsContent>
      ))}
    </Tabs>
  )
}
