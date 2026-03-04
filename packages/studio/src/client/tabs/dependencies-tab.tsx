import { Network } from 'lucide-react'

export function DependenciesTab() {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '12px',
        color: '#64748b',
      }}
    >
      <Network size={32} style={{ color: '#475569' }} />
      <span style={{ fontSize: '13px', fontWeight: 500 }}>Dependency Map</span>
      <span style={{ fontSize: '11px', color: '#475569' }}>
        Visualize which libs are used by which apps
      </span>
    </div>
  )
}
