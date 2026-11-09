import type { ChangeEvent } from 'react'

// Spread onto a literal <input> so the lint rule sees it inside its label
export function fileInputProps(onFile: (file: File) => void) {
  return {
    type: 'file',
    'aria-label': 'Open a spoiler log',
    accept: '.json,application/json',
    className: 'sr-only',
    onChange(event: ChangeEvent<HTMLInputElement>) {
      const input = event.currentTarget
      const file = input.files?.[0]
      // Clear the picker so choosing the same file again still opens it
      input.value = ''
      if (file) onFile(file)
    },
  } as const
}
