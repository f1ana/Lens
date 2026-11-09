import { Crashed } from './Crashed'
import { ErrorBoundary } from './ErrorBoundary'
import { Shell } from './Shell'

export default function App() {
  return (
    <ErrorBoundary fallback={<Crashed />}>
      <Shell />
    </ErrorBoundary>
  )
}
