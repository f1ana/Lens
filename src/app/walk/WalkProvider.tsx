import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'

import type { Trail } from '@/app/walk/utils/trail'

import { WalkContext } from './walk-context'

// Above the tabs, whose content unmounts when another section shows
export function WalkProvider({ children }: { children: ReactNode }) {
  const [trail, setTrail] = useState<null | Trail>(null)
  const walk = useMemo(() => ({ trail, setTrail }), [trail])
  return <WalkContext value={walk}>{children}</WalkContext>
}
