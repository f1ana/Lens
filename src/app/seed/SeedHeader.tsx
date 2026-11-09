import { ChevronDown } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import type { Build, Seed } from '@/model/seed'

import { FactList } from './FactList'

const BUILD_LABELS: Record<Build['kind'], string> = {
  official: 'Official release',
  unofficial: 'Unofficial build',
  unrecorded: 'Version not found in log',
  unverified: 'Build not verified',
}

export function SeedHeader({ seed }: { seed: Seed }) {
  const { title, subtitle, provenance, facts, details } = seed

  return (
    <header className="flex flex-col gap-3 pt-8 pb-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance break-words">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge variant="secondary">{provenance.port}</Badge>
          <Badge variant="outline">{BUILD_LABELS[provenance.build.kind]}</Badge>
        </div>
      </div>
      <FactList facts={facts} />
      {details.length > 0 ? (
        <Collapsible className="group/details">
          <CollapsibleTrigger asChild>
            <Button className="-ml-2" size="xs" variant="ghost">
              Build details
              <ChevronDown
                aria-hidden
                className="transition-transform group-data-[state=open]/details:rotate-180"
                data-icon="inline-end"
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <FactList facts={details} />
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </header>
  )
}
