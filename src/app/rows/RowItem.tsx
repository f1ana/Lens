import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export function RowItem({ className, ...props }: ComponentProps<'li'>) {
  return (
    <li className={cn('-mx-3 border-b border-border', className)} {...props} />
  )
}
