import { ConfigTab } from './tabs/config-tab'
import { DependenciesTab } from './tabs/dependencies-tab'
import { GraphTab } from './tabs/graph-tab'
import { OverviewTab } from './tabs/overview-tab'
import { ShellTab } from './tabs/shell-tab'

interface StudioTabsProps {
  activeTab: string
}

export function StudioTabs({ activeTab }: StudioTabsProps) {
  return (
    <div style={{ height: '100%', width: '100%' }}>
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'graph' && <GraphTab />}
      {activeTab === 'config' && <ConfigTab />}
      {activeTab === 'dependencies' && <DependenciesTab />}
      {activeTab === 'shell' && <ShellTab />}
    </div>
  )
}
