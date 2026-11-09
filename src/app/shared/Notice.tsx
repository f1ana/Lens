import { Alert, AlertDescription } from '@/components/ui/alert'

export function Notice({ message }: { message: string }) {
  return (
    <Alert>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
