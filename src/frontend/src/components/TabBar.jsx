// Tab navigation bar
const TABS = [
  { id: 'scanner', label: 'SCANNER' },
  { id: 'active', label: 'MOST ACTIVE CHAINS' },
  { id: 'watchlist', label: 'WATCHLIST' },
];

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <nav className="tab-bar" role="tablist" aria-label="Main navigation">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
