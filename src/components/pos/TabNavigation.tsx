import { cn } from '@/lib/utils';

export type TabType = 'menu' | 'stock' | 'reports' | 'settings' | 'history';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string }[] = [
  { id: 'menu', label: 'MENU' },
  { id: 'stock', label: 'STOCK' },
  { id: 'reports', label: 'REPORTS' },
  { id: 'history', label: 'HISTORY' },
  { id: 'settings', label: 'SETTINGS' },
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex border-b border-border bg-card">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'pos-tab',
            activeTab === tab.id && 'active'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
