export function nextPaint(): Promise<void> {
  // Hidden tabs never run animation frames, so don't wait for one
  if (document.hidden) return Promise.resolve()
  return new Promise((resolve) => {
    requestAnimationFrame(() => setTimeout(resolve, 0))
  })
}
