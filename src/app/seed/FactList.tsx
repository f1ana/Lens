import type { Fact } from '@/model/seed'

export function FactList({ facts }: { facts: Fact[] }) {
  return (
    <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
      {facts.map((fact) => (
        <div className="flex gap-1.5" key={fact.label}>
          <dt className="whitespace-nowrap text-muted-foreground">
            {fact.label}
          </dt>
          <dd className="font-medium break-words">{fact.value || 'None'}</dd>
        </div>
      ))}
    </dl>
  )
}
