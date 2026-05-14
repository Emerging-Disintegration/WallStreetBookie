// Root component — manages tabs, search state, and layout
import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from './hooks/useApi';
import TickerTapeBackground from './components/TickerTapeBackground';
import TickerStrip from './components/TickerStrip';
import TabBar from './components/TabBar';
import ProfitCalculator from './components/ProfitCalculator';
import ResultsTable from './components/ResultsTable';
import FlowView from './components/FlowView';
import Watchlist from './components/Watchlist';
import TitleBar from './components/TitleBar';
import Settings from './components/Settings';

function App() {
  const api = useApi();
  const [activeTab, setActiveTab] = useState('scanner');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vixData, setVixData] = useState(null);
  const [watchlistTickers, setWatchlistTickers] = useState([]);
  const [expiration, setExpiration] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState('default');
  const [tickerStripSymbols, setTickerStripSymbols] = useState([]);
  const [watchlistRange, setWatchlistRange] = useState('1D');
  const refreshTimerRef = useRef(null);

  // Flow tab session cache — survives tab switches since App never unmounts
  const flowCacheRef = useRef({
    stocks: { data: null, loading: false, error: null, loaded: false, lastUpdated: null },
    etfs: { data: null, loading: false, error: null, loaded: false, lastUpdated: null },
    unusual: { data: null, loading: false, error: null, loaded: false, lastUpdated: null },
  });
  // Watchlist session cache per range — survives tab switches
  const watchlistCacheRef = useRef({});
  const [activeFlowSubTab, setActiveFlowSubTab] = useState('stocks');

  // Track mobile width for responsive layout
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const refreshWatchlist = useCallback(async (range = '1D', force = false) => {
    if (!api) return;
    const cache = watchlistCacheRef.current[range];
    const ttl = range === '1D' ? 60_000 : 300_000; // 1min / 5min

    // Use cache if fresh
    if (!force && cache && Date.now() - cache.timestamp < ttl) {
      setWatchlistTickers(cache.data);
      return;
    }

    try {
      const res = await api.get_watchlist_with_prices(range);
      if (res.success) {
        watchlistCacheRef.current[range] = {
          data: res.data,
          timestamp: Date.now()
        };
        setWatchlistTickers(res.data);
      }
    } catch {
      // Silent fail
    }
  }, [api]);

  const handleWatchlistRangeChange = useCallback((range, force) => {
    setWatchlistRange(range);
    refreshWatchlist(range, force);
  }, [refreshWatchlist]);

  const scheduleDebouncedRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      refreshWatchlist(watchlistRange);
    }, 300);
  }, [refreshWatchlist, watchlistRange]);

  const handleToggleFavorite = useCallback((symbol, isAdding) => {
    if (isAdding) {
      setWatchlistTickers(prev => [...prev, { symbol }]);
    } else {
      setWatchlistTickers(prev => prev.filter(t => t.symbol !== symbol));
    }
    // Invalidate all watchlist caches on add/remove
    watchlistCacheRef.current = {};
    scheduleDebouncedRefresh();
  }, [scheduleDebouncedRefresh]);

  // Fetch watchlist on app mount
  useEffect(() => {
    refreshWatchlist('1D');
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
              <span className="version">v0.4.1</span>
            </div>
            <p className="subtitle">
              Get the inside line 🎰
            </p>
          </div>
        </header>

        {/* Market tickers */}
        <TickerStrip api={api} onVixData={setVixData} symbols={tickerStripSymbols} />

        {/* Navigation + VIX */}
        <div className="tab-row">
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} isMobile={isMobile} />
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
              isMobile={isMobile}
            />
          </>
        )}

        {/* Flow tab */}
        {activeTab === 'flow' && (
          <FlowView
            api={api}
            watchlistTickers={watchlistTickers}
            onToggleFavorite={handleToggleFavorite}
            isMobile={isMobile}
            flowCacheRef={flowCacheRef}
            activeSubTab={activeFlowSubTab}
            onSubTabChange={setActiveFlowSubTab}
          />
        )}

        {/* Watchlist tab */}
        {activeTab === 'watchlist' && (
          <Watchlist
            tickers={watchlistTickers}
            onToggleFavorite={handleToggleFavorite}
            api={api}
            range={watchlistRange}
            onRangeChange={handleWatchlistRangeChange}
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
