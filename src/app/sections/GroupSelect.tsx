import type { Grouping } from '@/model/seed'

import { OptionSelect } from './OptionSelect'

interface GroupSelectProps {
  groupings: Grouping[]
  onValueChange: (groupingId: string) => void
  value: string
}

export function GroupSelect({
  groupings,
  value,
  onValueChange,
}: GroupSelectProps) {
  return (
    <OptionSelect
      label="Group by"
      onValueChange={onValueChange}
      options={groupings.map(({ id, label }) => ({ value: id, label }))}
      value={value}
    />
  )
}
