import { ActiveTab } from '../types/meeting';

interface TabNavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  tabCounts: {
    upcoming: number;
    live: number;
    past: number;
    cancelled: number;
    expired: number;
  };
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, setActiveTab, tabCounts }) => {
  const tabs = [
    { key: 'upcoming' as const, label: 'À venir', count: tabCounts.upcoming },
    { key: 'live' as const, label: 'En direct', count: tabCounts.live },
    { key: 'past' as const, label: 'Passées', count: tabCounts.past },
    { key: 'cancelled' as const, label: 'Annulées', count: tabCounts.cancelled },
    { key: 'expired' as const, label: 'Expirées', count: tabCounts.expired }
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-2 mb-8 shadow-sm">
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-3 px-6 py-4 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
              activeTab === key 
                ? 'border-blue-600 text-blue-600 bg-blue-50 rounded-t-lg' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>{label}</span>
            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
              activeTab === key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};