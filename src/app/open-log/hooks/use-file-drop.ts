import { useEffect, useEffectEvent, useState } from 'react'

export function useFileDrop(onFile: (file: File) => void): boolean {
  const [dragging, setDragging] = useState(false)
  const onDropped = useEffectEvent(onFile)

  useEffect(() => {
    // dragenter and dragleave also fire for every child element, so count them
    let depth = 0
    const hasFiles = (event: DragEvent) =>
      event.dataTransfer?.types.includes('Files') ?? false

    const onDragEnter = (event: DragEvent) => {
      if (!hasFiles(event)) return
      depth += 1
      setDragging(true)
    }
    const onDragLeave = (event: DragEvent) => {
      if (!hasFiles(event)) return
      depth = Math.max(0, depth - 1)
      if (depth === 0) setDragging(false)
    }
    // Without this the browser would navigate to the dropped file
    const onDragOver = (event: DragEvent) => {
      event.preventDefault()
    }
    const onDrop = (event: DragEvent) => {
      event.preventDefault()
      depth = 0
      setDragging(false)
      const file = event.dataTransfer?.files[0]
      if (file) onDropped(file)
    }

    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('drop', onDrop)
    }
  }, [])

  return dragging
}
