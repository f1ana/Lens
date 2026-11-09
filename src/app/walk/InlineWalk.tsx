import { X } from 'lucide-react'
import { useEffect } from 'react'

import { WALK_TITLE } from '@/app/walk/utils/title'
import { Button } from '@/components/ui/button'

import type { WalkPanelProps } from './WalkPanel'
import { WalkPanel } from './WalkPanel'

interface InlineWalkProps extends WalkPanelProps {
  onClose: () => void
}

export function InlineWalk({ trail, places, onClose }: InlineWalkProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Escape belongs first to an open menu or to clearing search
      if (
        event.key === 'Escape' &&
        !event.defaultPrevented &&
        !(event.target instanceof HTMLInputElement)
      )
        onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return (
    <aside
      aria-label={WALK_TITLE}
      className="sticky top-[calc(var(--bar-height,0px)+var(--head-height,0px)+0.5rem)] flex max-h-[calc(100svh-var(--bar-height,0px)-var(--head-height,0px)-1rem)] min-w-0 flex-col overflow-hidden rounded-lg border border-border"
    >
      <Button
        aria-label="Close"
        className="absolute top-2 right-2 z-1 bg-background"
        onClick={onClose}
        size="icon-sm"
        variant="ghost"
      >
        <X aria-hidden />
      </Button>
      <div className="min-h-0 overflow-y-auto">
        <WalkPanel places={places} trail={trail} />
      </div>
    </aside>
  )
}
