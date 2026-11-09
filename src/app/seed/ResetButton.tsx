import { RotateCcw } from 'lucide-react'

import { ConfirmDialog } from '@/app/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'

export function ResetButton({ onConfirm }: { onConfirm: () => void }) {
  return (
    <ConfirmDialog
      confirmLabel="Reset"
      description={
        <>
          This closes the log and clears your ticks and saved layout choices
          from this browser. You&rsquo;ll need to open a spoiler log again.
        </>
      }
      destructive
      onConfirm={onConfirm}
      title="Reset Lens?"
      trigger={
        <Button variant="outline">
          <RotateCcw aria-hidden data-icon="inline-start" />
          Reset
        </Button>
      }
    />
  )
}
