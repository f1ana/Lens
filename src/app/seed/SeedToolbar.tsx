import { Search } from 'lucide-react'
import type { Ref } from 'react'

import { OpenLogButton } from '@/app/open-log/OpenLogButton'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'

import { ResetButton } from './ResetButton'
import { RevealAll } from './RevealAll'

interface SeedToolbarProps {
  allTicked: boolean
  canReveal: boolean
  onFile: (file: File) => void
  onQueryChange: (query: string) => void
  onReset: () => void
  onToggleAll: () => void
  query: string
  ref: Ref<HTMLDivElement>
}

export function SeedToolbar({
  ref,
  query,
  onQueryChange,
  canReveal,
  allTicked,
  onToggleAll,
  onFile,
  onReset,
}: SeedToolbarProps) {
  return (
    <div
      className="sticky top-0 z-10 -mx-4 flex flex-wrap gap-2 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6"
      ref={ref}
    >
      <InputGroup className="w-auto min-w-48 flex-1">
        <InputGroupAddon>
          <Search aria-hidden />
        </InputGroupAddon>
        <InputGroupInput
          aria-label="Search checks and items"
          autoComplete="off"
          name="search"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search checks & items…"
          spellCheck={false}
          type="search"
          value={query}
        />
      </InputGroup>
      {canReveal ? (
        <RevealAll allTicked={allTicked} onConfirm={onToggleAll} />
      ) : null}
      <OpenLogButton onFile={onFile} />
      <ResetButton onConfirm={onReset} />
    </div>
  )
}
