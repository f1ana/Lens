import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

import { ConfirmDialog } from '@/app/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'

export function RevealAll({
  allTicked,
  onConfirm,
}: {
  allTicked: boolean
  onConfirm: () => void
}) {
  // allTicked flips while the dialog fades out, so its wording is fixed on open
  const [hiding, setHiding] = useState(allTicked)

  return (
    <ConfirmDialog
      confirmLabel={hiding ? 'Hide all' : 'Reveal all'}
      description={
        hiding
          ? 'This clears every tick, including the ones you made yourself.'
          : 'This shows what every check holds and every hint says, and ticks them all. Hiding them again clears your own ticks too.'
      }
      onConfirm={onConfirm}
      onOpenChange={(open) => {
        if (open) setHiding(allTicked)
      }}
      title={hiding ? 'Hide every item?' : 'Reveal every item?'}
      trigger={
        <Button variant="outline">
          {allTicked ? (
            <EyeOff aria-hidden data-icon="inline-start" />
          ) : (
            <Eye aria-hidden data-icon="inline-start" />
          )}
          {allTicked ? 'Hide all' : 'Reveal all'}
        </Button>
      }
    />
  )
}
