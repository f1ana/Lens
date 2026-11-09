import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'

export function NoMatches() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>No matches</EmptyTitle>
        <EmptyDescription>
          Try fewer words, or look in another section.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
