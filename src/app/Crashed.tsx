import { Button } from '@/components/ui/button'
import { clearAllState } from '@/storage/local'

function clearAndReload() {
  clearAllState()
  location.reload()
}

export function Crashed() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="text-muted-foreground">
        Lens hit a problem showing this log. Clearing the saved log and
        reloading usually fixes it.
      </p>
      <div>
        <Button onClick={clearAndReload}>Clear saved log and reload</Button>
      </div>
    </main>
  )
}
