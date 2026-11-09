import { FileUp } from 'lucide-react'

import { fileInputProps } from '@/app/open-log/utils/file-input-props'
import { Button } from '@/components/ui/button'

interface OpenLogButtonProps {
  onFile: (file: File) => void
}

export function OpenLogButton({ onFile }: OpenLogButtonProps) {
  return (
    <Button
      asChild
      className="has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
      variant="outline"
    >
      <label className="cursor-pointer">
        <FileUp aria-hidden data-icon="inline-start" />
        <span>Open another log</span>
        <input {...fileInputProps(onFile)} />
      </label>
    </Button>
  )
}
