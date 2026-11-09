import { Fragment, useEffect, useRef } from 'react'

import type { Trail } from '@/app/walk/utils/trail'
import { followDoor, stepBack } from '@/app/walk/utils/trail'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import type { Link, Place } from '@/model/seed'

import { CrumbLabel } from './CrumbLabel'
import { Doors } from './Doors'
import { useWalk } from './walk-context'

export interface WalkPanelProps {
  places: Record<string, Place>
  trail: Trail
}

export function WalkPanel({ trail, places }: WalkPanelProps) {
  const { setTrail } = useWalk()
  const hereRef = useRef<HTMLDivElement>(null)
  const moved = useRef(false)
  const step = trail.steps.at(-1)
  const place = step?.placeId === undefined ? undefined : places[step.placeId]

  // Move focus after a door click, but not on mount, which would steal it
  useEffect(() => {
    if (moved.current) hereRef.current?.focus()
    moved.current = false
  }, [trail])

  const move = (next: Trail) => {
    moved.current = next !== trail
    setTrail(next)
  }

  const onSelect = (door: Link) => move(followDoor(trail, door))

  return (
    <div className="flex min-w-0 flex-col gap-3 p-3">
      <Breadcrumb className="pr-8">
        <BreadcrumbList>
          {trail.steps.map((crumb, index) => {
            const last = index === trail.steps.length - 1
            return (
              <Fragment key={crumb.placeId ?? crumb.label}>
                <BreadcrumbItem className="min-w-0 break-words">
                  <CrumbLabel
                    crumb={crumb}
                    last={last}
                    onBack={() => move(stepBack(trail, index))}
                  />
                </BreadcrumbItem>
                {last ? null : <BreadcrumbSeparator />}
              </Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div
        aria-live="polite"
        className="outline-none"
        ref={hereRef}
        tabIndex={-1}
      >
        <p className="text-sm text-muted-foreground">You&apos;re in</p>
        <h3 className="text-lg font-semibold break-words">
          {place?.name ?? step?.label}
        </h3>
        {step?.detail === undefined ? null : (
          <p className="text-sm break-words text-muted-foreground">
            {step.detail}
          </p>
        )}
      </div>

      <Doors onSelect={onSelect} place={place} trail={trail} />
    </div>
  )
}
