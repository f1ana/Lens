import { useId } from 'react'

import { Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Option {
  label: string
  value: string
}

interface OptionSelectProps {
  label: string
  onValueChange: (value: string) => void
  options: Option[]
  value: string
}

export function OptionSelect({
  label,
  options,
  value,
  onValueChange,
}: OptionSelectProps) {
  const id = useId()

  return (
    <Field className="w-auto items-center" orientation="horizontal">
      <FieldLabel className="text-muted-foreground" htmlFor={id}>
        {label}
      </FieldLabel>
      <Select onValueChange={onValueChange} value={value}>
        <SelectTrigger className="max-w-56 min-w-28" id={id} size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" position="popper">
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )
}
