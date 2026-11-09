import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export function GroupHeading({
  className,
  children,
  ...props
}: ComponentProps<'h3'>) {
  return (
    <h3
      className={cn(
        '-mx-3 mb-1 bg-background/90 px-3 py-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase backdrop-blur',
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  )
}
