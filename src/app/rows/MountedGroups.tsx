import type { ReactNode } from 'react'
import { Fragment } from 'react'

import type { Row, RowGroup } from '@/model/seed'

import { GroupHeading } from './GroupHeading'

interface MountedGroupsProps {
  groups: RowGroup[]
  renderRow: (row: Row, position: number, group: RowGroup) => ReactNode
}

export function MountedGroups({ groups, renderRow }: MountedGroupsProps) {
  return (
    <div className="flex flex-col gap-6">
      {groups.map((group, index) => (
        <div key={group.title ?? index}>
          {group.title ? (
            <GroupHeading className="sticky top-[calc(var(--bar-height,0px)+var(--head-height,0px))] z-1">
              {group.title}
            </GroupHeading>
          ) : null}
          <ul>
            {group.rows.map((row, position) => (
              <Fragment key={row.id}>
                {renderRow(row, position, group)}
              </Fragment>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
