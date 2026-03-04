import { ChevronDown, ChevronUp, Hexagon } from 'lucide-react'

interface StudioBottomBarProps {
  isOpen: boolean
  onToggle: () => void
}

export function StudioBottomBar({ isOpen, onToggle }: StudioBottomBarProps) {
  return (
    <button
      type="button"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '32px',
        background: '#0f0f14',
        borderTop: '1px solid #1e1e2e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        zIndex: 2147483647,
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onToggle()
      }}
      tabIndex={0}
    >
      {/* Left: Kompo branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Hexagon size={12} style={{ color: '#7c3aed' }} />
        <span
          style={{
            color: '#94a3b8',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}
        >
          Kompo Studio
        </span>
      </div>

      {/* Right: Toggle indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            color: '#475569',
            fontSize: '10px',
            fontFamily: 'monospace',
          }}
        >
          Ctrl+K
        </span>
        {isOpen ? (
          <ChevronDown size={12} style={{ color: '#64748b' }} />
        ) : (
          <ChevronUp size={12} style={{ color: '#64748b' }} />
        )}
      </div>
    </button>
  )
}
