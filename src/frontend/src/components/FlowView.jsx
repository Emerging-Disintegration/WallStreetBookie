// Flow view — active stocks, ETFs, and unusual options activity with session caching
import { useState, useEffect, useCallback } from 'react';
import GlowCard from './GlowCard';

const SUB_TABS = [
  { id: 'stocks', label: 'Stock Options' },
  { id: 'etfs', label: 'ETF Options' },
  { id: 'unusual', label: 'Unusual Activity' },
  { id: 'sentiment', label: 'Sentiment' },
];

export default function FlowView({ api, watchlistTickers = [], onToggleFavorite, isMobile, flowCacheRef, activeSubTab, onSubTabChange }) {
  const [, forceRender] = useState(0);

  const cacheRef = flowCacheRef;

  const isFaved = useCallback(
    (ticker) => watchlistTickers.some((t) => t.symbol === ticker.toUpperCase()),
    [watchlistTickers]
  );

  const toggleFavorite = useCallback(
    async (e, ticker) => {
      e.stopPropagation();
      const symbol = ticker.toUpperCase();
      const wasInWatchlist = isFaved(symbol);

      try {
        const res = wasInWatchlist
          ? await api.remove_favorite(symbol)
          : await api.add_favorite(symbol);

        if (res.success && onToggleFavorite) {
          onToggleFavorite(symbol, !wasInWatchlist);
        }
      } catch {
        // silently fail
      }
    },
    [api, isFaved, onToggleFavorite]
  );

  const fetchData = useCallback(
    async (tabId) => {
      if (!api) return;

      const cache = cacheRef.current[tabId];
      if (cache.loaded || cache.loading) return;

      cache.loading = true;
      cache.error = null;
      forceRender((n) => n + 1);

      try {
        let res;
        if (tabId === 'stocks') {
          res = await api.get_active_stocks();
        } else if (tabId === 'etfs') {
          res = await api.get_active_etfs();
        } else if (tabId === 'sentiment') {
          res = await api.get_sentiment();
        } else {
          res = await api.get_options_flow();
        }

        if (res.success) {
          cache.data = res.data || [];
          cache.loaded = true;
          cache.lastUpdated = Date.now();
        } else {
          cache.error = res.error || 'Failed to load data';
        }
      } catch (e) {
        cache.error = e.message || 'Failed to load data';
      } finally {
        cache.loading = false;
        forceRender((n) => n + 1);
      }
    },
    [api, cacheRef]
  );

  useEffect(() => {
    fetchData(activeSubTab);
  }, [activeSubTab, fetchData]);

  const handleRetry = useCallback(
    (tabId) => {
      const cache = cacheRef.current[tabId];
      cache.loaded = false;
      cache.error = null;
      fetchData(tabId);
    },
    [fetchData, cacheRef]
  );

  const formatVolume = (num) => {
    if (typeof num !== 'number' || isNaN(num)) return '—';
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
    return num.toLocaleString();
  };

  const formatRatio = (ratio) => {
    const val = typeof ratio === 'number' ? ratio : parseFloat(ratio);
    if (isNaN(val)) return '—';
    if (val >= 1000) return `${(val / 1000).toFixed(2)}K`;
    return val.toFixed(2);
  };

  const timeAgo = (timestamp) => {
    if (!timestamp) return '';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Updated just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Updated ${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Updated ${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `Updated ${days} day${days > 1 ? 's' : ''} ago`;
  };

  const cache = cacheRef.current[activeSubTab];

  return (
    <GlowCard className={`flow-card${isMobile ? ' flow-mobile' : ''}`}>
      <div className="flow-subtab-bar" role="tablist" aria-label="Flow categories">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeSubTab === tab.id}
            className={`flow-subtab-btn${activeSubTab === tab.id ? ' active' : ''}`}
            onClick={() => onSubTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {cache.loaded && cache.lastUpdated && (
        <div className="flow-last-updated">{timeAgo(cache.lastUpdated)}</div>
      )}

      <div className="flow-content">
        {cache.loading ? (
          <div className="loading">
            Loading {SUB_TABS.find((t) => t.id === activeSubTab)?.label.toLowerCase()}…
          </div>
        ) : cache.error ? (
          <div className="active-empty">
            <p>{cache.error}</p>
            <button onClick={() => handleRetry(activeSubTab)} className="btn-retry">
              Try Again
            </button>
          </div>
        ) : !cache.data || cache.data.length === 0 ? (
          <div className="active-empty">
            <p>No data available.</p>
            <button onClick={() => handleRetry(activeSubTab)} className="btn-retry">
              Refresh
            </button>
          </div>
        ) : activeSubTab === 'unusual' ? (
          <div className="table-scroll-container">
            <table>
              <caption className="sr-only">Unusual options activity</caption>
              <thead>
                <tr>
                  <th className="col-star">☆</th>
                  <th>Ticker</th>
                  <th>Expiry</th>
                  <th>Strike</th>
                  <th>Type</th>
                  <th>Vol/OI</th>
                  <th>Volume</th>
                  <th>OI</th>
                </tr>
              </thead>
              <tbody>
                {cache.data.map((item, i) => {
                  const typeClass =
                    item.type?.toLowerCase() === 'call'
                      ? 'call'
                      : item.type?.toLowerCase() === 'put'
                        ? 'put'
                        : '';
                  const ratioVal = parseFloat(item.ratio) || 0;

                  return (
                    <tr key={i}>
                      <td className="col-star">
                        <button
                          className={`fav-btn${isFaved(item.ticker) ? ' active' : ''}`}
                          onClick={(e) => toggleFavorite(e, item.ticker)}
                          aria-label={
                            isFaved(item.ticker)
                              ? 'Remove from watchlist'
                              : 'Add to watchlist'
                          }
                        >
                          {isFaved(item.ticker) ? '★' : '☆'}
                        </button>
                      </td>
                      <td className="ticker">{item.ticker}</td>
                      <td className="mono">{item.expiry}</td>
                      <td className="mono">{item.strike}</td>
                      <td className={typeClass}>{item.type}</td>
                      <td
                        className={`mono flow-ratio ${ratioVal > 1 ? 'ratio-bull' : 'ratio-bear'}`}
                      >
                        {formatRatio(item.ratio)}
                      </td>
                      <td className="mono">{formatVolume(item.optionVolume)}</td>
                      <td className="mono">{formatVolume(item.openInterest)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : activeSubTab === 'sentiment' ? (
          <div className="table-scroll-container">
            <table>
              <caption className="sr-only">Reddit sentiment</caption>
              <thead>
                <tr>
                  <th className="col-star">☆</th>
                  <th className="col-rank">Rank</th>
                  <th>Ticker</th>
                  <th>Mentions</th>
                  <th>Upvotes</th>
                  <th>24h Δ</th>
                </tr>
              </thead>
              <tbody>
                {cache.data.map((item, i) => {
                  const rankClass = i < 3 ? 'rank-top' : 'rank';
                  const rankDelta = typeof item.rank_delta === 'number' ? item.rank_delta : 0;
                  const mentionDelta =
                    typeof item.mention_delta === 'number' ? item.mention_delta : 0;

                  return (
                    <tr key={i}>
                      <td className="col-star">
                        <button
                          className={`fav-btn${isFaved(item.ticker) ? ' active' : ''}`}
                          onClick={(e) => toggleFavorite(e, item.ticker)}
                          aria-label={
                            isFaved(item.ticker)
                              ? 'Remove from watchlist'
                              : 'Add to watchlist'
                          }
                        >
                          {isFaved(item.ticker) ? '★' : '☆'}
                        </button>
                      </td>
                      <td className={`${rankClass} col-rank`}>{item.rank ?? i + 1}</td>
                      <td className="ticker">
                        {item.ticker}
                        {item.name && (
                          <span className="sentiment-name">{item.name}</span>
                        )}
                      </td>
                      <td className="mono">
                        {(item.mentions ?? 0).toLocaleString()}
                      </td>
                      <td className="mono">
                        {(item.upvotes ?? 0).toLocaleString()}
                      </td>
                      <td className="mono">
                        <div>
                          Rank:{' '}
                          <span className={rankDelta >= 0 ? 'sentiment-up' : 'sentiment-down'}>
                            {rankDelta >= 0 ? `+${rankDelta}` : rankDelta}
                          </span>
                        </div>
                        <div>
                          Mentions:{' '}
                          <span
                            className={mentionDelta >= 0 ? 'sentiment-up' : 'sentiment-down'}
                          >
                            {mentionDelta >= 0 ? `+${mentionDelta}` : mentionDelta}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-scroll-container">
            <table>
              <caption className="sr-only">
                {activeSubTab === 'stocks' ? 'Most active stock options' : 'Most active ETF options'}
              </caption>
              <thead>
                <tr>
                  <th className="col-star">☆</th>
                  <th className="col-rank">#</th>
                  <th>Ticker</th>
                  <th>Total Vol</th>
                  <th>Calls</th>
                  <th>Puts</th>
                  <th>P/C Ratio</th>
                </tr>
              </thead>
              <tbody>
                {cache.data.map((item, i) => {
                  const rankClass = i < 3 ? 'rank-top' : 'rank';
                  const callVol = item.callVolume || item.calls || 0;
                  const putVol = item.putVolume || item.puts || 0;
                  const total = item.totalVolume || callVol + putVol;
                  const ratio = callVol > 0 ? (putVol / callVol).toFixed(2) : '—';
                  const isBull = parseFloat(ratio) <= 0.7;

                  return (
                    <tr key={i}>
                      <td className="col-star">
                        <button
                          className={`fav-btn${isFaved(item.ticker) ? ' active' : ''}`}
                          onClick={(e) => toggleFavorite(e, item.ticker)}
                          aria-label={
                            isFaved(item.ticker)
                              ? 'Remove from watchlist'
                              : 'Add to watchlist'
                          }
                        >
                          {isFaved(item.ticker) ? '★' : '☆'}
                        </button>
                      </td>
                      <td className={`${rankClass} col-rank`}>{i + 1}</td>
                      <td className="ticker">{item.ticker}</td>
                      <td className="mono vol-total">{formatVolume(total)}</td>
                      <td className="mono vol-call">{formatVolume(callVol)}</td>
                      <td className="mono vol-put">{formatVolume(putVol)}</td>
                      <td className={`mono ${isBull ? 'ratio-bull' : 'ratio-bear'}`}>{ratio}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </GlowCard>
  );
}
