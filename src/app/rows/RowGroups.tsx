import type { ReactNode } from 'react'
import { useMemo } from 'react'

import { filterRows } from '@/app/rows/utils/search'
import { useReveals, useSearch } from '@/app/seed/seed-view-context'
import type { Row, RowGroup } from '@/model/seed'

import { MatchStatus } from './MatchStatus'
import { MountedGroups } from './MountedGroups'
import { NoMatches } from './NoMatches'
import { VirtualGroups } from './VirtualGroups'

interface RowGroupsProps {
  groups: RowGroup[]
  renderRow: (row: Row, position: number, group: RowGroup) => ReactNode
}

// Fewer rows cost less to mount than to virtualize
const VIRTUALIZE_ABOVE = 500

export function RowGroups({ groups, renderRow }: RowGroupsProps) {
  const { checks, ticked } = useReveals()
  const query = useSearch()
  const shown = useMemo(
    () => filterRows(groups, checks, query, ticked),
    [groups, checks, query, ticked],
  )
  const matches = shown.reduce((total, group) => total + group.rows.length, 0)

  return (
    <>
      <MatchStatus matches={matches} query={query} />
      {shown.length === 0 ? <NoMatches /> : null}
      {shown.length > 0 && matches > VIRTUALIZE_ABOVE ? (
        <VirtualGroups groups={shown} renderRow={renderRow} />
      ) : null}
      {shown.length > 0 && matches <= VIRTUALIZE_ABOVE ? (
        <MountedGroups groups={shown} renderRow={renderRow} />
      ) : null}
    </>
  )
}
