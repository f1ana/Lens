import { lazy, Suspense, useEffect } from 'react'

import { useFileDrop } from '@/app/open-log/hooks/use-file-drop'
import { useLogOpener } from '@/app/open-log/hooks/use-log-opener'
import { LoadingLog } from '@/app/open-log/LoadingLog'
import { OpenLog } from '@/app/open-log/OpenLog'
import { useGameTheme } from '@/hooks/use-game-theme'

// Loaded on its own so the open screen doesn't wait for it
const loadSeedView = () => import('@/app/seed/SeedView')
const SeedView = lazy(() =>
  loadSeedView().then((module) => ({ default: module.SeedView })),
)

export function Shell() {
  const { seed, message, loading, openFile, reset } = useLogOpener()
  const dragging = useFileDrop(openFile)
  useGameTheme(seed?.provenance.theme ?? 'landing')

  // Opening a log takes a while, so fetch the view alongside it
  useEffect(() => {
    if (loading) void loadSeedView()
  }, [loading])

  return (
    <>
      {/* Keyboard can't reach the old log while the next one opens */}
      <div inert={loading}>
        {seed ? (
          <Suspense fallback={<LoadingLog />}>
            <SeedView
              key={seed.key}
              message={message}
              onFile={openFile}
              onReset={reset}
              seed={seed}
            />
          </Suspense>
        ) : null}
      </div>
      {seed || loading ? null : <OpenLog message={message} onFile={openFile} />}
      {loading ? <LoadingLog /> : null}
      {dragging ? (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-3 z-50 flex items-center justify-center rounded-2xl border-2 border-dashed border-primary bg-background/85 text-lg font-medium text-primary backdrop-blur-sm"
        >
          Drop to open this log
        </div>
      ) : null}
    </>
  )
}
