// Root component — manages tabs, search state, and layout
import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from './hooks/useApi';
import TickerTapeBackground from './components/TickerTapeBackground';
import TickerStrip from './components/TickerStrip';
import TabBar from './components/TabBar';
import ProfitCalculator from './components/ProfitCalculator';
import ResultsTable from './components/ResultsTable';
import MostActiveTable from './components/MostActiveTable';
import Watchlist from './components/Watchlist';
import TitleBar from './components/TitleBar';
import Settings from './components/Settings';

function App() {
  const api = useApi();
  const [activeTab, setActiveTab] = useState('scanner');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vixData, setVixData] = useState(null);
  const [watchlistTickers, setWatchlistTickers] = useState([]);
  const [expiration, setExpiration] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState('default');
  const [tickerStripSymbols, setTickerStripSymbols] = useState([]);
  const refreshTimerRef = useRef(null);

  // Load theme on mount
  useEffect(() => {
    if (api) {
      api.get_settings().then(resp => {
        if (resp.success) {
          setTheme(resp.data.theme || 'default');
          if (resp.data.ticker_strip && resp.data.ticker_strip.length > 0) {
            setTickerStripSymbols(resp.data.ticker_strip);
          }
        }
      });
    }
  }, [api]);

  // Apply theme as data attribute on root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const refreshWatchlist = useCallback(async () => {
    if (!api) return;
    try {
      const res = await api.get_watchlist_with_prices();
      if (res.success) {
        setWatchlistTickers(res.data);
      }
    } catch (e) {
      // Silent fail — watchlist will show as empty
    }
  }, [api]);

  const scheduleDebouncedRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      refreshWatchlist();
      // eslint-disable-next-line react-hooks/set-state-in-effect
    }, 300);
  }, [refreshWatchlist]);

  const handleToggleFavorite = useCallback((symbol, isAdding) => {
    if (isAdding) {
      setWatchlistTickers(prev => [...prev, { symbol }]);
    } else {
      setWatchlistTickers(prev => prev.filter(t => t.symbol !== symbol));
    }
    scheduleDebouncedRefresh();
  }, [scheduleDebouncedRefresh]);

  // Fetch watchlist on app mount
  useEffect(() => {
    refreshWatchlist();
  }, [refreshWatchlist]);

  const handleSearch = async ({ mode, ticker, expiration, targetGain, optionType }) => {
    if (!api) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setExpiration(expiration);

    try {
      if (mode === 'single') {
        const res = await api.search_options(ticker, expiration, targetGain, optionType);
        if (res.success) {
          setResults(res.data);
        } else {
          setError(res.error);
        }
      } else {
        // top 3 mode — fetch active stocks then search each
        const activeRes = await api.get_active_stocks();
        if (!activeRes.success) {
          setError(activeRes.error);
          setLoading(false);
          return;
        }
        const tickers = activeRes.data.slice(0, 3);
        let allResults = [];
        for (const t of tickers) {
          const name = typeof t === 'string' ? t : t.ticker;
          const res = await api.search_options(name, expiration, targetGain, optionType);
          if (res.success) {
            allResults = [...allResults, ...res.data];
          }
        }
        setResults(allResults);
      }
    } catch (e) {
      setError(e.message || 'Search failed');
    }

    setLoading(false);
  };

  if (!api) {
    return (
      <>
        <TickerTapeBackground />
        <div className="bg-orb-2" />
        <div className="bg-orb-3" />
        <div className="loading" role="status" aria-live="polite">Loading WallStreetBookie...</div>
      </>
    );
  }

  // center the UI vertically when scanner has no results or watchlist is empty
  const hasResults = results.length > 0;
  const scannerEmpty = activeTab === 'scanner' && !hasResults;
  const watchlistEmpty = activeTab === 'watchlist' && watchlistTickers.length === 0;
  const shouldCenter = scannerEmpty || watchlistEmpty;

  return (
    <>
      <TitleBar onSettingsOpen={() => setSettingsOpen(true)} />

      {/* Background layers */}
      <TickerTapeBackground />
      <div className="bg-orb-2" />
      <div className="bg-orb-3" />

      {/* Main content — centers vertically when no results */}
      <main className={`app-content${shouldCenter ? ' centered' : ''}`}>
        {/* Header */}
        <header className="header">
          <div className="header-center">
            <div className="header-left">
              <span className="logo">WallStreetBookie</span>
              <span className="version">v0.3.2</span>
            </div>
            <p className="subtitle">
              Find your next YOLO in seconds!
            </p>
          </div>
        </header>

        {/* Market tickers */}
        <TickerStrip api={api} onVixData={setVixData} symbols={tickerStripSymbols} />

        {/* Navigation + VIX */}
        <div className="tab-row">
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
          {vixData && (() => {
            const change = Number(vixData.change) || 0;
            const price = Number(vixData.price) || 0;
            const isUp = change >= 0;
            const direction = isUp ? 'up' : 'down';
            const sign = isUp ? '+' : '';
            const changeStr = `${sign}${change.toFixed(2)}%`;
            return (
              <div className={`ticker-item vix-item ${direction}`}>
                <span className="ticker-symbol">VIX:</span>
                <span className="ticker-price mono">
                  {price.toFixed(2)}
                </span>
                <span className={`ticker-change mono ${direction}`}>
                  {changeStr}
                </span>
              </div>
            );
          })()}
        </div>

        {/* Error banner */}
        {error && <div className="error-banner" role="alert">{error}</div>}

        {/* Scanner tab */}
        {activeTab === 'scanner' && (
          <>
            <ProfitCalculator onSearch={handleSearch} loading={loading} />
            <ResultsTable
              results={results}
              watchlistTickers={watchlistTickers}
              onToggleFavorite={handleToggleFavorite}
              api={api}
              expiration={expiration}
            />
          </>
        )}

        {/* Most Active tab */}
        {activeTab === 'active' && (
          <MostActiveTable api={api} watchlistTickers={watchlistTickers} onToggleFavorite={handleToggleFavorite} />
        )}

        {/* Watchlist tab */}
        {activeTab === 'watchlist' && (
          <Watchlist
            tickers={watchlistTickers}
            onToggleFavorite={handleToggleFavorite}
            api={api}
          />
        )}
      </main>

      {/* Settings overlay */}
      <Settings
        api={api}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onThemeChange={setTheme}
        onTickerStripChange={setTickerStripSymbols}
      />
    </>
  );
}

export default App;
