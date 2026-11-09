import { OptionSelect } from './OptionSelect'

// Select items can't have an empty value, and a title could be any text
const ALL = 'all'
const GROUP_PREFIX = 'group:'

interface GroupFilterProps {
  onValueChange: (title: string | undefined) => void
  titles: string[]
  // Undefined shows every group
  value: string | undefined
}

export function GroupFilter({
  titles,
  value,
  onValueChange,
}: GroupFilterProps) {
  return (
    <OptionSelect
      label="Show"
      onValueChange={(next) =>
        onValueChange(
          next.startsWith(GROUP_PREFIX)
            ? next.slice(GROUP_PREFIX.length)
            : undefined,
        )
      }
      options={[
        { value: ALL, label: 'All' },
        ...titles.map((title) => ({
          value: GROUP_PREFIX + title,
          label: title,
        })),
      ]}
      value={value === undefined ? ALL : GROUP_PREFIX + value}
    />
  )
}
