import type { RefObject } from 'react'
import { useLayoutEffect } from 'react'

export function useHeightVar(
  ref: RefObject<HTMLElement | null>,
  name: `--${string}`,
): void {
  useLayoutEffect(() => {
    const element = ref.current
    const host = element?.parentElement
    if (!element || !host) return

    const publish = () => {
      host.style.setProperty(name, `${element.offsetHeight}px`)
    }
    publish()

    const observer = new ResizeObserver(publish)
    observer.observe(element)
    return () => {
      observer.disconnect()
      host.style.removeProperty(name)
    }
  }, [ref, name])
}
