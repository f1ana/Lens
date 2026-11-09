import { MatchStatus } from '@/app/rows/MatchStatus'
import { NoMatches } from '@/app/rows/NoMatches'
import { matchesText } from '@/app/rows/utils/search'
import { useSearch } from '@/app/seed/seed-view-context'

export function TextBody({ text }: { text: string }) {
  const query = useSearch()
  const found = matchesText(text, query)
  return (
    <>
      <MatchStatus matches={found ? 1 : 0} query={query} />
      {found ? (
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-3 text-xs">
          {text}
        </pre>
      ) : (
        <NoMatches />
      )}
    </>
  )
}
