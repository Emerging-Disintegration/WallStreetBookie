// Watchlist tab — shows saved tickers with remove functionality
import { useState } from 'react';
import GlowCard from './GlowCard';

export default function Watchlist({ tickers, onRefresh, api }) {
  const [removing, setRemoving] = useState({});
  const [error, setError] = useState(null);

  const handleRemove = async (symbol) => {
    if (removing[symbol]) return;
    setRemoving((prev) => ({ ...prev, [symbol]: true }));
    setError(null);

    try {
      const res = await api.remove_favorite(symbol);
      if (res.success) {
        await onRefresh();
      } else {
        setError(`Failed to remove ${symbol} from watchlist`);
      }
    } catch (e) {
      setError(`Failed to remove ${symbol} from watchlist`);
    }

    setRemoving((prev) => ({ ...prev, [symbol]: false }));
  };

  // Format added_at date for display
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return 'Today';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!tickers) {
    return (
      <GlowCard className="watchlist-card">
        <div className="loading">Loading watchlist...</div>
      </GlowCard>
    );
  }

  // Reverse chronological order
  const sorted = [...tickers].reverse();

  return (
    <>
      {error && <div className="error-banner" role="alert">{error}</div>}

      <GlowCard className="watchlist-card">
        {tickers.length === 0 ? (
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
              <span className="watchlist-count">
                {tickers.length} ticker{tickers.length !== 1 ? 's' : ''}
              </span>
            </div>
            <ul className="watchlist-list">
              {sorted.map((item) => (
                <li
                  key={item.symbol}
                  className={`watchlist-item${removing[item.symbol] ? ' removing' : ''}`}
                >
                  <div className="watchlist-item-left">
                    <span className="watchlist-symbol">{item.symbol}</span>
                    <span className="watchlist-date mono">
                      {formatDate(item.added_at)}
                    </span>
                  </div>
                  <button
                    className="watchlist-remove"
                    aria-label={`Remove ${item.symbol} from watchlist`}
                    onClick={() => handleRemove(item.symbol)}
                    disabled={removing[item.symbol]}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </GlowCard>
    </>
  );
}
