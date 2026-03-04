import { Activity, Box, Hexagon, Layers } from 'lucide-react'

export function OverviewTab() {
  return (
    <div style={{ padding: '20px', color: '#e2e8f0' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <StatCard icon={<Layers size={18} />} label="Apps" value="—" color="#7c3aed" />
        <StatCard icon={<Box size={18} />} label="Libraries" value="—" color="#3b82f6" />
        <StatCard icon={<Hexagon size={18} />} label="Domains" value="—" color="#10b981" />
        <StatCard icon={<Activity size={18} />} label="Adapters" value="—" color="#f59e0b" />
      </div>

      <div
        style={{
          background: '#111118',
          border: '1px solid #1e1e2e',
          borderRadius: '8px',
          padding: '20px',
        }}
      >
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#e2e8f0',
            marginBottom: '12px',
            marginTop: 0,
          }}
        >
          Quick Start
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <QuickLink label="View Architecture Graph" shortcut="Graph tab" />
          <QuickLink label="Inspect Configuration" shortcut="Config tab" />
          <QuickLink label="Open Shell" shortcut="Shell tab" />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div
      style={{
        background: '#111118',
        border: '1px solid #1e1e2e',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#e2e8f0' }}>{value}</div>
        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  )
}

function QuickLink({ label, shortcut }: { label: string; shortcut: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderRadius: '6px',
        background: '#0a0a10',
        border: '1px solid #1e1e2e',
      }}
    >
      <span style={{ fontSize: '12px', color: '#cbd5e1' }}>{label}</span>
      <span
        style={{
          fontSize: '10px',
          color: '#475569',
          fontFamily: 'monospace',
          background: '#1e1e2e',
          padding: '2px 6px',
          borderRadius: '3px',
        }}
      >
        {shortcut}
      </span>
    </div>
  )
}
