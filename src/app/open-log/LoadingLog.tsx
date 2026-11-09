import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'

export function LoadingLog() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm">
      <Empty aria-live="polite" className="flex-none border-0" role="status">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Spinner aria-hidden role="presentation" />
          </EmptyMedia>
          <EmptyTitle>Opening your log</EmptyTitle>
          <EmptyDescription>
            Large logs can take a moment on slower devices.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}
