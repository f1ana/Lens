import { ChevronRight } from 'lucide-react'
import { memo } from 'react'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import type { Check } from '@/model/seed'

import { RowItem } from './RowItem'

interface CheckRowProps {
  check: Check
  onToggle: (checkId: string) => void
  ticked: boolean
}

export const CheckRow = memo(function CheckRow({
  check,
  ticked,
  onToggle,
}: CheckRowProps) {
  const hasHints = ticked && check.hints.length > 0

  return (
    <RowItem className="flex gap-3 px-3 py-2.5">
      <Checkbox
        aria-label={`Reveal ${check.name}`}
        checked={ticked}
        className="mt-0.5"
        onCheckedChange={() => onToggle(check.id)}
      />
      <Collapsible className="group/hints min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {hasHints ? (
            <CollapsibleTrigger className="-ml-1 flex items-center gap-1 rounded px-1 text-left font-semibold break-words hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
              <ChevronRight
                aria-hidden
                className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/hints:rotate-90"
              />
              {check.name}
            </CollapsibleTrigger>
          ) : (
            <span className="font-semibold break-words">{check.name}</span>
          )}
          {ticked
            ? check.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))
            : null}
          {hasHints ? <Badge variant="secondary">hinted</Badge> : null}
        </div>
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
          {ticked ? (
            <>
              <span className="font-medium">{check.item}</span>
              {check.disguise === undefined ? null : (
                <span className="text-muted-foreground">
                  Looks like {check.disguise}
                </span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground italic">Hidden</span>
          )}
          {check.price === undefined ? null : (
            <span className="text-muted-foreground">{check.price}</span>
          )}
        </p>
        {hasHints ? (
          <CollapsibleContent className="mt-2 border-l-2 border-border pl-3 text-sm">
            <ul className="flex flex-col gap-2">
              {check.hints.map((hint) => (
                <li key={`${hint.source}|${hint.text}`}>
                  <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {hint.source}
                  </span>
                  <p className="whitespace-pre-line">{hint.text}</p>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        ) : null}
      </Collapsible>
    </RowItem>
  )
})
