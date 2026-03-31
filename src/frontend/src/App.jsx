// Root component — manages tabs, search state, and layout
import { useState, useEffect, useCallback } from 'react';
import { useApi } from './hooks/useApi';
import TickerTapeBackground from './components/TickerTapeBackground';
import TickerStrip from './components/TickerStrip';
import TabBar from './components/TabBar';
import ProfitCalculator from './components/ProfitCalculator';
import ResultsTable from './components/ResultsTable';
import MostActiveTable from './components/MostActiveTable';
import Watchlist from './components/Watchlist';
import TitleBar from './components/TitleBar';

function App() {
  const api = useApi();
  const [activeTab, setActiveTab] = useState('scanner');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vixData, setVixData] = useState(null);
  const [watchlistTickers, setWatchlistTickers] = useState([]);
  const [expiration, setExpiration] = useState('');

  const refreshWatchlist = useCallback(async () => {
    if (!api) return;
    try {
      const res = await api.get_watchlist();
      if (res.success) {
        setWatchlistTickers(res.data);
      }
    } catch (e) {
      // Silent fail — watchlist will show as empty
    }
  }, [api]);

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
      <TitleBar />

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
              <span className="version">v0.2</span>
            </div>
            <p className="subtitle">
              Find your next YOLO in seconds!
            </p>
          </div>
        </header>

        {/* Market tickers */}
        <TickerStrip api={api} onVixData={setVixData} />

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
              onRefresh={refreshWatchlist}
              api={api}
              expiration={expiration}
            />
          </>
        )}

        {/* Most Active tab */}
        {activeTab === 'active' && (
          <MostActiveTable api={api} />
        )}

        {/* Watchlist tab */}
        {activeTab === 'watchlist' && (
          <Watchlist
            tickers={watchlistTickers}
            onRefresh={refreshWatchlist}
            api={api}
          />
        )}
      </main>
    </>
  );
}

export default App;
