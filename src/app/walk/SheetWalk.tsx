import { WALK_TITLE } from '@/app/walk/utils/title'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Place } from '@/model/seed'

import type { Trail } from './utils/trail'
import { WalkPanel } from './WalkPanel'

interface SheetWalkProps {
  onClose: () => void
  onClosed: () => void
  places: Record<string, Place>
  trail: null | Trail
}

export function SheetWalk({
  trail,
  places,
  onClose,
  onClosed,
}: SheetWalkProps) {
  return (
    <Sheet
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      open={trail !== null}
    >
      <SheetContent
        aria-describedby={undefined}
        className="gap-0 data-[side=right]:w-11/12"
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          onClosed()
        }}
        side="right"
      >
        <SheetHeader className="pb-0">
          <SheetTitle className="sr-only">{WALK_TITLE}</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {trail ? <WalkPanel places={places} trail={trail} /> : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
