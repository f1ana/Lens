import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty'

export function Note({ children }: { children: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>{children}</EmptyTitle>
      </EmptyHeader>
    </Empty>
  )
}
