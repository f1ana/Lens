import type { Trail } from '@/app/walk/utils/trail'
import { BreadcrumbLink, BreadcrumbPage } from '@/components/ui/breadcrumb'

interface CrumbLabelProps {
  crumb: Trail['steps'][number]
  last: boolean
  onBack: () => void
}

export function CrumbLabel({ crumb, last, onBack }: CrumbLabelProps) {
  if (last) return <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
  if (crumb.placeId === undefined) return crumb.label
  return (
    <BreadcrumbLink asChild>
      <button className="text-left" onClick={onBack} type="button">
        {crumb.label}
      </button>
    </BreadcrumbLink>
  )
}
