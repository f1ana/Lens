import { createContext, use } from 'react'

import type { Trail } from '@/app/walk/utils/trail'

export interface Walk {
  setTrail: (trail: null | Trail) => void
  trail: null | Trail
}

export const WalkContext = createContext<null | Walk>(null)

export function useWalk(): Walk {
  const walk = use(WalkContext)
  if (!walk) throw new Error('useWalk needs a WalkProvider')
  return walk
}
