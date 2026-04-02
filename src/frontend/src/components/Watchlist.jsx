// Watchlist tab — shows saved tickers with price, change, and remove functionality
import { useState, useEffect, useCallback, useRef } from 'react';
import GlowCard from './GlowCard';
import ToggleGroup from './ToggleGroup';

const RANGES = ['1D', '5D', '1M', '6M', 'YTD', '1Y'];

export default function Watchlist({ tickers, onRefresh, api }) {
  const [localTickers, setLocalTickers] = useState(null);
  const [range, setRange] = useState('1D');
  const rangeRef = useRef('1D');
  const [removing, setRemoving] = useState({});
  const [error, setError] = useState(null);
  const [rangeLoading, setRangeLoading] = useState(false);

  const fetchWithRange = useCallback(async (r) => {
    if (!api) return;
    setRangeLoading(true);
    try {
      const res = await api.get_watchlist_with_prices(r);
      if (res.success) setLocalTickers(res.data);
    } catch (e) {}
    setRangeLoading(false);
  }, [api]);

  // Re-fetch when parent signals a change (add/remove from another tab)
  useEffect(() => {
    if (tickers !== null) {
      fetchWithRange(rangeRef.current);
    }
  }, [tickers, fetchWithRange]);

  const handleRangeChange = (r) => {
    setRange(r);
    rangeRef.current = r;
    fetchWithRange(r);
  };

  const handleRemove = async (symbol) => {
    if (removing[symbol]) return;
    setRemoving((prev) => ({ ...prev, [symbol]: true }));
    setError(null);
    try {
      const res = await api.remove_favorite(symbol);
      if (res.success) {
        await onRefresh(); // updates tickers prop → triggers useEffect above
      } else {
        setError(`Failed to remove ${symbol} from watchlist`);
      }
    } catch (e) {
      setError(`Failed to remove ${symbol} from watchlist`);
    }
    setRemoving((prev) => ({ ...prev, [symbol]: false }));
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return 'Today';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const displayTickers = localTickers ?? tickers;

  if (!displayTickers) {
    return (
      <GlowCard className="watchlist-card">
        <div className="loading">Loading watchlist...</div>
      </GlowCard>
    );
  }

  const sorted = [...displayTickers].reverse();

  return (
    <>
      {error && <div className="error-banner" role="alert">{error}</div>}
      <GlowCard className="watchlist-card">
        {displayTickers.length === 0 ? (
          <div className="watchlist-empty">
            <div className="watchlist-empty-icon">&#9734;</div>
            <div className="watchlist-empty-title">No tickers saved yet</div>
            <p className="watchlist-empty-hint">
              Run a scan and tap the <span>&#9733;</span> next to any ticker to add it here.
            </p>
          </div>
        ) : (
          <>
            <div className="watchlist-header">
              <span className="watchlist-label">YOUR WATCHLIST</span>
              <ToggleGroup
                options={RANGES}
                value={range}
                onChange={handleRangeChange}
                small
              />
              <span className="watchlist-count">
                {displayTickers.length} ticker{displayTickers.length !== 1 ? 's' : ''}
              </span>
            </div>
            <ul className={`watchlist-list${rangeLoading ? ' loading-dim' : ''}`}>
              {sorted.map((item) => (
                <li
                  key={item.symbol}
                  className={`watchlist-item${removing[item.symbol] ? ' removing' : ''}`}
                >
                  <div className="watchlist-item-left">
                    <span className="watchlist-symbol">{item.symbol}</span>
                    {item.price != null && (
                      <span className="watchlist-price mono">
                        ${Number(item.price).toFixed(2)}
                      </span>
                    )}
                    {item.change != null && (
                      <span className={`watchlist-change mono ${item.change >= 0 ? 'positive' : 'negative'}`}>
                        {item.change >= 0 ? '+' : ''}{Number(item.change).toFixed(2)}%
                      </span>
                    )}
                  </div>
                  <div className="watchlist-item-right">
                    <span className="watchlist-date mono">
                      {formatDate(item.added_at)}
                    </span>
                    <button
                      className="watchlist-remove"
                      aria-label={`Remove ${item.symbol} from watchlist`}
                      onClick={() => handleRemove(item.symbol)}
                      disabled={removing[item.symbol]}
                    >
                      &times;
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </GlowCard>
    </>
  );
}
