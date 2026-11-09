import { ArrowRight } from 'lucide-react'
import { memo } from 'react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Link } from '@/model/seed'

import { RowItem } from './RowItem'

interface LinkRowProps {
  badge?: string
  label?: string
  link: Link
  onSelect: (link: Link) => void
  selected?: boolean
}

const NAME = 'font-semibold break-words'

export const LinkRow = memo(function LinkRow({
  link,
  label,
  selected = false,
  badge,
  onSelect,
}: LinkRowProps) {
  const { place, detail } = link.landing

  return (
    <RowItem className="@container">
      <button
        aria-current={selected ? 'true' : undefined}
        className={cn(
          'grid w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-1 px-3 py-2.5 text-left hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset @md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]',
          selected && 'bg-accent text-accent-foreground hover:bg-accent',
        )}
        data-row-id={link.id}
        onClick={() => onSelect(link)}
        type="button"
      >
        <span className="col-span-2 min-w-0 @md:col-span-1">
          <span className={NAME}>{label ?? link.door}</span>
        </span>
        <ArrowRight aria-hidden className="mt-1 size-4 text-muted-foreground" />
        <span className="sr-only"> leads to </span>
        <span className="min-w-0">
          <span className={NAME}>{place}</span>
          {detail === undefined ? null : (
            <span className="block text-sm break-words text-muted-foreground">
              {detail}
            </span>
          )}
          {badge === undefined ? null : (
            <Badge className="mt-1" variant="outline">
              {badge}
            </Badge>
          )}
        </span>
      </button>
    </RowItem>
  )
})
