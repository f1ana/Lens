import type { ReactNode } from 'react'
import { useMemo } from 'react'

import type { Check } from '@/model/seed'

import type { Choices } from './seed-view-context'
import {
  ChoicesContext,
  RevealsContext,
  SearchContext,
} from './seed-view-context'

interface SeedViewProviderProps {
  checks: Map<string, Check>
  children: ReactNode
  choices: Choices
  onToggle: (id: string) => void
  query: string
  ticked: ReadonlySet<string>
}

export function SeedViewProvider({
  checks,
  ticked,
  onToggle,
  query,
  choices,
  children,
}: SeedViewProviderProps) {
  const reveals = useMemo(
    () => ({ checks, ticked, onToggle }),
    [checks, ticked, onToggle],
  )

  return (
    <SearchContext value={query}>
      <RevealsContext value={reveals}>
        <ChoicesContext value={choices}>{children}</ChoicesContext>
      </RevealsContext>
    </SearchContext>
  )
}
