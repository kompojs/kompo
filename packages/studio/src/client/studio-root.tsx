import { useCallback, useEffect, useState } from 'react'
import { StudioPanel } from './studio-panel'

export function StudioRoot() {
  const [isVisible, setIsVisible] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setIsFullscreen(false)
  }, [])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  const toggleVisibility = useCallback(() => {
    setIsVisible((prev) => {
      if (prev) {
        // Hiding: also close the panel
        setIsOpen(false)
        setIsFullscreen(false)
      }
      return !prev
    })
  }, [])

  useEffect(() => {
    // Listen for custom event (from plugin-injected script)
    const handler = () => toggleVisibility()
    window.addEventListener('kompo-studio:toggle', handler)

    // Keyboard shortcut (Ctrl+K / Cmd+K) — hides/shows the entire toolbar
    const keyHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        e.stopPropagation()
        toggleVisibility()
      }
    }
    document.addEventListener('keydown', keyHandler, true)

    return () => {
      window.removeEventListener('kompo-studio:toggle', handler)
      document.removeEventListener('keydown', keyHandler, true)
    }
  }, [toggleVisibility])

  if (!isVisible) return null

  return (
    <StudioPanel
      isOpen={isOpen}
      isFullscreen={isFullscreen}
      onClose={close}
      onToggle={togglePanel}
      onToggleFullscreen={toggleFullscreen}
    />
  )
}
