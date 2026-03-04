import { Settings } from 'lucide-react'

export function ConfigTab() {
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
      <Settings size={32} style={{ color: '#475569' }} />
      <span style={{ fontSize: '13px', fontWeight: 500 }}>Configuration Inspector</span>
      <span style={{ fontSize: '11px', color: '#475569' }}>
        View and inspect your kompo.config.json
      </span>
    </div>
  )
}
