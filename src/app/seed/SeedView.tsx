import { useDeferredValue, useMemo, useRef, useState } from 'react'

import { useSectionChoices } from '@/app/sections/hooks/use-section-choices'
import { SectionTabs } from '@/app/sections/SectionTabs'
import { useTicks } from '@/app/seed/hooks/use-ticks'
import { Notice } from '@/app/shared/Notice'
import { WalkProvider } from '@/app/walk/WalkProvider'
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { useHeightVar } from '@/hooks/use-height-var'
import type { Seed } from '@/model/seed'

import { SeedHeader } from './SeedHeader'
import { SeedToolbar } from './SeedToolbar'
import { SeedViewProvider } from './SeedViewProvider'

interface SeedViewProps {
  message?: string
  onFile: (file: File) => void
  onReset: () => void
  seed: Seed
}

export function SeedView({ seed, message, onFile, onReset }: SeedViewProps) {
  const barRef = useRef<HTMLDivElement>(null)
  // Section headers pin below this bar
  useHeightVar(barRef, '--bar-height')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const { ticked, canReveal, allTicked, toggle, toggleAll } = useTicks(seed)
  // With nothing to reveal, nothing could bring the counts back
  const hideSpoilerCounts = canReveal && !allTicked
  const choices = useSectionChoices(seed)
  const checks = useMemo(
    () => new Map(seed.checks.map((check) => [check.id, check])),
    [seed.checks],
  )

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
      <SeedHeader seed={seed} />
      <SeedToolbar
        allTicked={allTicked}
        canReveal={canReveal}
        onFile={onFile}
        onQueryChange={setQuery}
        onReset={onReset}
        onToggleAll={toggleAll}
        query={query}
        ref={barRef}
      />

      {message ? (
        <div className="pt-4">
          <Notice message={message} />
        </div>
      ) : null}

      {seed.sections.length > 0 ? (
        <SeedViewProvider
          checks={checks}
          choices={choices}
          onToggle={toggle}
          query={deferredQuery}
          ticked={ticked}
        >
          <WalkProvider>
            <SectionTabs
              barRef={barRef}
              hideSpoilerCounts={hideSpoilerCounts}
              sections={seed.sections}
              stale={query !== deferredQuery}
            />
          </WalkProvider>
        </SeedViewProvider>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>This log has nothing to show.</EmptyTitle>
          </EmptyHeader>
        </Empty>
      )}
    </main>
  )
}
