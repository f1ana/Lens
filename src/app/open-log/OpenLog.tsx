import { Upload } from 'lucide-react'

import { fileInputProps } from '@/app/open-log/utils/file-input-props'
import { Notice } from '@/app/shared/Notice'
import { formats } from '@/formats'

import { SupportedFormats } from './SupportedFormats'

interface OpenLogProps {
  message?: string
  onFile: (file: File) => void
}

export function OpenLog({ message, onFile }: OpenLogProps) {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-8 px-4 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight">Lens</h1>
        <p className="text-balance text-muted-foreground">
          Open the spoiler log from your randomizer seed.
        </p>
      </header>
      <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border px-6 py-14 text-center transition-colors hover:border-primary hover:bg-primary/8 has-focus-visible:border-primary has-focus-visible:bg-primary/8">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/8 text-primary">
          <Upload aria-hidden className="size-5" />
        </span>
        <span className="text-lg font-medium">Choose a spoiler log</span>
        <span className="text-sm text-muted-foreground">
          or drop the file anywhere on this page
        </span>
        <span className="text-sm text-muted-foreground">
          You’ll find it in your game’s randomizer folder.
        </span>
        <input {...fileInputProps(onFile)} />
      </label>
      <SupportedFormats formats={formats} />
      {message ? <Notice message={message} /> : null}
    </main>
  )
}
