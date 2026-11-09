function matchSummary(query: string, matches: number): null | string {
  if (query.trim() === '') return null
  return matches === 1 ? '1 match' : `${matches} matches`
}

export function MatchStatus({
  query,
  matches,
}: {
  matches: number
  query: string
}) {
  return (
    <p className="sr-only" role="status">
      {matchSummary(query, matches)}
    </p>
  )
}
