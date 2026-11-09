import { isRecord } from '@/lib/is-record'
import type { LogFormat, OpenResult } from '@/model/seed'

import { twoShipFormat } from './2ship'
import { lighthouseFormat } from './lighthouse'
import { DataLoadError } from './shared/release-data'
import { shipFormat } from './ship'

export const MAX_LOG_LENGTH = 20_000_000

export const MESSAGES = {
  notJson:
    'This file isn’t valid JSON, so Lens can’t read it. Pick a spoiler log from your game’s randomizer folder.',
  notALog:
    'This doesn’t look like a spoiler log. Pick a spoiler log from your game’s randomizer folder.',
  tooLarge: 'This file is too large to be a spoiler log.',
  readFailed:
    'This file couldn’t be read. Pick a spoiler log from your game’s randomizer folder.',
  dataUnavailable:
    'Lens couldn’t load the reference data for this log. Check your connection and try again.',
} satisfies Record<
  'dataUnavailable' | 'notALog' | 'notJson' | 'readFailed' | 'tooLarge',
  string
>

export const formats: LogFormat[] = [
  shipFormat,
  twoShipFormat,
  lighthouseFormat,
]

const BYTE_ORDER_MARK = '\uFEFF'

function rejected(
  reason: 'data-unavailable' | 'not-a-log' | 'not-json' | 'too-large',
  message: string,
): OpenResult {
  return { status: 'rejected', reason, message }
}

export async function openLogWith(
  candidates: LogFormat[],
  text: string,
): Promise<OpenResult> {
  if (text.length > MAX_LOG_LENGTH)
    return rejected('too-large', MESSAGES.tooLarge)

  const body = text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text

  let data: unknown
  try {
    data = JSON.parse(body)
  } catch {
    return rejected('not-json', MESSAGES.notJson)
  }

  if (!isRecord(data)) return rejected('not-a-log', MESSAGES.notALog)

  try {
    for (const format of candidates)
      if (format.recognizes(data)) return await format.read(data)
    return rejected('not-a-log', MESSAGES.notALog)
  } catch (error) {
    // The log may be fine: the data it needs didn't arrive
    if (error instanceof DataLoadError)
      return rejected('data-unavailable', MESSAGES.dataUnavailable)
    return rejected('not-a-log', MESSAGES.readFailed)
  }
}

export function openLogText(text: string): Promise<OpenResult> {
  return openLogWith(formats, text)
}
