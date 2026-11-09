import { useEffect, useReducer, useState } from 'react'

import { nextPaint } from '@/app/open-log/utils/paint'
import { MAX_LOG_LENGTH, MESSAGES, openLogText } from '@/formats'
import type { Seed } from '@/model/seed'
import { clearLastLog, loadLastLog, saveLastLog } from '@/storage/last-log'
import { clearAllState } from '@/storage/local'

export const SAVED_LOG_MESSAGE =
  'Your last saved log couldn’t be opened, so it was removed. Pick a log to continue.'

interface LogState {
  loading: boolean
  message?: string
  seed: null | Seed
}

type LogAction =
  | { message: string; type: 'failed' }
  | { seed: Seed; type: 'opened' }
  | { type: 'closed' }
  | { type: 'loading' }

function reducer(state: LogState, action: LogAction): LogState {
  switch (action.type) {
    case 'loading':
      return { ...state, loading: true }
    case 'opened':
      return { seed: action.seed, loading: false }
    case 'failed':
      return { ...state, message: action.message, loading: false }
    case 'closed':
      return { seed: null, loading: false }
  }
}

export function useLogOpener() {
  const [savedLog] = useState(loadLastLog)
  const [state, dispatch] = useReducer(reducer, {
    seed: null,
    loading: savedLog !== null,
  })

  useEffect(() => {
    if (savedLog === null) return
    const run = new AbortController()
    // A function call, so TypeScript doesn't narrow the signal across the await
    const cancelled = () => run.signal.aborted
    void nextPaint().then(async () => {
      if (cancelled()) return
      const result = await openLogText(savedLog)
      if (cancelled()) return
      if (result.status === 'opened') {
        dispatch({ type: 'opened', seed: result.seed })
      } else if (result.reason === 'data-unavailable') {
        // The log may be fine: keep it so the next visit can try again
        dispatch({ type: 'failed', message: result.message })
      } else {
        clearLastLog()
        dispatch({ type: 'failed', message: SAVED_LOG_MESSAGE })
      }
    })
    return () => {
      run.abort()
    }
  }, [savedLog])

  const readFile = async (file: File) => {
    let text: string
    try {
      text = await file.text()
    } catch {
      dispatch({ type: 'failed', message: MESSAGES.readFailed })
      return
    }
    // Let the indicator paint before parsing blocks the main thread
    await nextPaint()
    const result = await openLogText(text)
    if (result.status === 'opened') {
      saveLastLog(text)
      dispatch({ type: 'opened', seed: result.seed })
    } else {
      dispatch({ type: 'failed', message: result.message })
    }
  }

  const openFile = (file: File) => {
    if (state.loading) return
    if (file.size > MAX_LOG_LENGTH) {
      dispatch({ type: 'failed', message: MESSAGES.tooLarge })
      return
    }
    dispatch({ type: 'loading' })
    void readFile(file)
  }

  const reset = () => {
    clearAllState()
    dispatch({ type: 'closed' })
  }

  return { ...state, openFile, reset }
}
