import { useEffect, useRef } from 'react'

interface StudioOptionsMenuProps {
  onClose: () => void
}

const menuItems = [
  { label: 'Documentation', action: () => window.open('https://kompo.dev/docs', '_blank') },
  {
    label: 'Report a Bug',
    action: () =>
      window.open('https://github.com/kompo-dev/kompo/issues/new?template=bug_report.md', '_blank'),
  },
  {
    label: 'Feature Request',
    action: () =>
      window.open(
        'https://github.com/kompo-dev/kompo/issues/new?template=feature_request.md',
        '_blank'
      ),
  },
  { type: 'separator' as const },
  {
    label: 'GitHub Repository',
    action: () => window.open('https://github.com/kompo-dev/kompo', '_blank'),
  },
  { label: 'Discord Community', action: () => window.open('https://discord.gg/kompo', '_blank') },
]

export function StudioOptionsMenu({ onClose }: StudioOptionsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '4px',
        background: '#1a1a24',
        border: '1px solid #2a2a3a',
        borderRadius: '6px',
        padding: '4px',
        minWidth: '180px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        zIndex: 2147483647,
      }}
    >
      {menuItems.map((item) =>
        'type' in item && item.type === 'separator' ? (
          <div
            key={`sep-${item.label}`}
            style={{
              height: '1px',
              background: '#2a2a3a',
              margin: '4px 0',
            }}
          />
        ) : (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              if ('action' in item && item.action) item.action()
              onClose()
            }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              background: 'transparent',
              border: 'none',
              color: '#cbd5e1',
              padding: '6px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.1s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2a2a3a'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  )
}
