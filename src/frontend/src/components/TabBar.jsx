// Tab navigation bar
const TABS = [
  { id: 'scanner', label: 'SCANNER', labelMobile: 'SCANNER' },
  { id: 'flow', label: 'FLOW', labelMobile: 'FLOW' },
  { id: 'watchlist', label: 'WATCHLIST', labelMobile: 'WATCHLIST' },
];

export default function TabBar({ activeTab, onTabChange, isMobile }) {
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
          {isMobile ? tab.labelMobile : tab.label}
        </button>
      ))}
    </nav>
  );
}
