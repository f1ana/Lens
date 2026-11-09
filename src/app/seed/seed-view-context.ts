import { createContext, use } from 'react'

import type { Check } from '@/model/seed'
import type { GroupingChoices } from '@/storage/groupings'

export interface Choices {
  groupings: GroupingChoices
  groupTitles: Record<string, string | undefined>
  onGroupingChange: (sectionId: string, groupingId: string) => void
  onGroupTitleChange: (sectionId: string, title: string | undefined) => void
}

export interface Reveals {
  checks: Map<string, Check>
  onToggle: (id: string) => void
  ticked: ReadonlySet<string>
}

export const ChoicesContext = createContext<Choices | null>(null)
export const RevealsContext = createContext<null | Reveals>(null)
export const SearchContext = createContext<null | string>(null)

function required<T>(value: null | T, hook: string): T {
  if (value === null) throw new Error(`${hook} needs a SeedViewProvider`)
  return value
}

export function useChoices(): Choices {
  return required(use(ChoicesContext), 'useChoices')
}

export function useReveals(): Reveals {
  return required(use(RevealsContext), 'useReveals')
}

export function useSearch(): string {
  return required(use(SearchContext), 'useSearch')
}
