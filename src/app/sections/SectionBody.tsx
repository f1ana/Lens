import { LinkRows } from '@/app/rows/LinkRows'
import { RowGroups } from '@/app/rows/RowGroups'
import { Notice } from '@/app/shared/Notice'
import type { RowGroup, SectionContent } from '@/model/seed'

import { SectionRow } from './SectionRow'
import { TextBody } from './TextBody'

export function SectionBody({
  content,
  groups,
}: {
  content: SectionContent
  groups: RowGroup[]
}) {
  switch (content.kind) {
    case 'failed':
      return <Notice message={content.message} />
    case 'text':
      return <TextBody text={content.text} />
    case 'rows':
      return (
        <RowGroups
          groups={groups}
          renderRow={(row, position, group) => (
            <SectionRow group={group} position={position} row={row} />
          )}
        />
      )
    case 'links':
      return <LinkRows groups={groups} places={content.places} />
  }
}
