import {
  Ellipsis,
  GripHorizontal,
  Hexagon,
  Link2,
  Maximize2,
  MessageSquare,
  Minimize2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { StudioBottomBar } from './studio-bottom-bar'
import { StudioOptionsMenu } from './studio-options-menu'
import { StudioTabs } from './studio-tabs'

interface StudioPanelProps {
  isOpen: boolean
  isFullscreen: boolean
  onClose: () => void
  onToggle: () => void
  onToggleFullscreen: () => void
}

export function StudioPanel({
  isOpen,
  isFullscreen,
  onClose,
  onToggle,
  onToggleFullscreen,
}: StudioPanelProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [panelHeightPx, setPanelHeightPx] = useState(Math.round(window.innerHeight * 0.45))
  const [dragging, setDragging] = useState(false)
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(0)

  const BOTTOM_BAR_HEIGHT = 32
  const MIN_HEIGHT = 200
  const maxHeight = window.innerHeight - BOTTOM_BAR_HEIGHT

  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setDragging(true)
      dragStartY.current = e.clientY
      dragStartHeight.current = panelHeightPx
      document.body.style.cursor = 'row-resize'
      document.body.style.userSelect = 'none'
    },
    [panelHeightPx]
  )

  useEffect(() => {
    if (!dragging) return
    const onMouseMove = (e: MouseEvent) => {
      const delta = dragStartY.current - e.clientY
      const newHeight = Math.min(maxHeight, Math.max(MIN_HEIGHT, dragStartHeight.current + delta))
      setPanelHeightPx(newHeight)
    }
    const onMouseUp = () => {
      setDragging(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [dragging, maxHeight])

  const panelHeight = isFullscreen ? `calc(100vh - ${BOTTOM_BAR_HEIGHT}px)` : `${panelHeightPx}px`

  return (
    <>
      {/* Bottom bar — always visible */}
      <StudioBottomBar isOpen={isOpen} onToggle={onToggle} />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          bottom: isOpen ? `${BOTTOM_BAR_HEIGHT}px` : `-${panelHeight}`,
          left: 0,
          right: 0,
          height: panelHeight,
          transition: dragging ? 'none' : 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 2147483646,
          display: 'flex',
          flexDirection: 'column',
        }}
        className="kompo-studio-panel"
      >
        {/* Drag handle */}
        {!isFullscreen && (
          <button
            type="button"
            onMouseDown={onDragStart}
            style={{
              height: '6px',
              cursor: 'row-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#0f0f14',
              borderTop: '1px solid #1e1e2e',
              flexShrink: 0,
            }}
          >
            <GripHorizontal size={12} style={{ color: '#334155', pointerEvents: 'none' }} />
          </button>
        )}

        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '40px',
            minHeight: '40px',
            padding: '0 12px',
            background: '#0f0f14',
            borderTop: '1px solid #1e1e2e',
            borderBottom: '1px solid #1e1e2e',
          }}
        >
          {/* Left: Logo + Title + Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Hexagon size={16} style={{ color: '#7c3aed' }} />
              <span
                style={{
                  color: '#e2e8f0',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                }}
              >
                Kompo Studio
              </span>
            </div>

            {/* Tab navigation */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: activeTab === tab.id ? '#1e1e2e' : 'transparent',
                    color: activeTab === tab.id ? '#e2e8f0' : '#64748b',
                    border: 'none',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = '#94a3b8'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = '#64748b'
                    }
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right: Action icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <ActionButton
              icon={<MessageSquare size={14} />}
              title="Send Feedback"
              onClick={() => window.open('https://github.com/kompo-dev/kompo/issues/new', '_blank')}
            />
            <ActionButton
              icon={<Link2 size={14} />}
              title="Copy Link"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
              }}
            />
            <div style={{ position: 'relative' }}>
              <ActionButton
                icon={<Ellipsis size={14} />}
                title="Studio Options"
                onClick={() => setOptionsOpen(!optionsOpen)}
              />
              {optionsOpen && <StudioOptionsMenu onClose={() => setOptionsOpen(false)} />}
            </div>
            <ActionButton
              icon={isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              onClick={onToggleFullscreen}
            />
            <ActionButton icon={<X size={14} />} title="Close Studio" onClick={onClose} />
          </div>
        </div>

        {/* Tab content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            background: '#0a0a10',
          }}
        >
          <StudioTabs activeTab={activeTab} />
        </div>
      </div>
    </>
  )
}

// --- Tab definitions ---
const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'graph', label: 'Graph' },
  { id: 'config', label: 'Config' },
  { id: 'dependencies', label: 'Dependencies' },
  { id: 'shell', label: 'Shell' },
]

// --- Action button ---
function ActionButton({
  icon,
  title,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 'none',
        color: '#64748b',
        padding: '6px',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#1e1e2e'
        e.currentTarget.style.color = '#e2e8f0'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = '#64748b'
      }}
    >
      {icon}
    </button>
  )
}
