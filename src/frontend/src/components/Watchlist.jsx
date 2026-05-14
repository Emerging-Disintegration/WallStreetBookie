// Watchlist tab — shows saved tickers with price, change, and remove functionality
import { useState, useEffect, useRef, useMemo } from 'react';
import GlowCard from './GlowCard';
import ToggleGroup from './ToggleGroup';
import TagFilter from './TagFilter';
import TagEditor from './TagEditor';

const RANGES = ['1D', '5D', '1M', '6M', 'YTD', '1Y'];

export default function Watchlist({ tickers, onToggleFavorite, api, range: propRange, onRangeChange }) {
  const [range, setRange] = useState(propRange || '1D');
  const rangeRef = useRef(range);
  const [removing, setRemoving] = useState({});
  const [error] = useState(null);
  const [sortDirection, setSortDirection] = useState('off');
  const [activeTag, setActiveTag] = useState(null);
  const [editingTagsFor, setEditingTagsFor] = useState(null);
  const debounceTimerRef = useRef(null);

  // Auto-refresh for 1D range every 2 minutes
  useEffect(() => {
    if (range !== '1D') return;
    const interval = setInterval(() => {
      onRangeChange('1D', true);
    }, 120_000);
    return () => clearInterval(interval);
  }, [range, onRangeChange]);

  const handleRangeChange = (r) => {
    setRange(r);
    rangeRef.current = r;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onRangeChange(r);
    }, 200);
  };

  const handleRemove = async (symbol) => {
    if (removing[symbol]) return;
    setRemoving((prev) => ({ ...prev, [symbol]: true }));
    // Optimistic remove
    if (onToggleFavorite) {
      onToggleFavorite(symbol, false);
    }
    try {
      await api.remove_favorite(symbol);
    } catch {
      // Revert on failure
      if (onToggleFavorite) {
        onToggleFavorite(symbol, true);
      }
    }
    setRemoving((prev) => ({ ...prev, [symbol]: false }));
  };

  const handleRetry = async (symbol) => {
    try {
      const res = await api.get_stock_card_data(symbol);
      if (res.success) {
        onRangeChange(rangeRef.current, true);
      }
    } catch {
      // Silent fail
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return 'Today';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const allTags = useMemo(() => {
    if (!tickers) return [];
    const tagSet = new Set();
    tickers.forEach(t => (t.tags || []).forEach(tag => tagSet.add(tag)));
    return [...tagSet].sort();
  }, [tickers]);

  // Filter by tag first, then sort by % change
  const displayList = useMemo(() => {
    if (!tickers) return [];
    let list = [...tickers];
    if (activeTag) {
      list = list.filter(t => (t.tags || []).includes(activeTag));
    }
    if (sortDirection === 'off') return list.reverse();
    return list.sort((a, b) => {
      const aVal = a.change ?? 0;
      const bVal = b.change ?? 0;
      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [tickers, activeTag, sortDirection]);

  if (!tickers) {
    return (
      <GlowCard className="watchlist-card">
        <div className="loading">Loading watchlist...</div>
      </GlowCard>
    );
  }

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
              <div className="watchlist-timeframe-scroll">
                <ToggleGroup
                  options={RANGES}
                  value={range}
                  onChange={handleRangeChange}
                  small
                />
              </div>
              <button
                className={`watchlist-sort-btn${sortDirection !== 'off' ? ' active' : ''}`}
                onClick={() => {
                  if (sortDirection === 'off') setSortDirection('desc');
                  else if (sortDirection === 'desc') setSortDirection('asc');
                  else setSortDirection('off');
                }}
                title={sortDirection === 'off' ? 'Sort by % change' : `Sorted ${sortDirection === 'desc' ? '↓' : '↑'}`}
              >
                {sortDirection === 'off' ? '↕' : sortDirection === 'desc' ? '↓' : '↑'}
              </button>
              <span className="watchlist-count">
                {tickers.length} ticker{tickers.length !== 1 ? 's' : ''}
              </span>
            </div>
            <TagFilter tags={allTags} activeTag={activeTag} onTagSelect={setActiveTag} />
            <ul className="watchlist-list">
              {displayList.map((item) => (
                <li
                  key={item.symbol}
                  className={`watchlist-item${removing[item.symbol] ? ' removing' : ''}${item._failed ? ' watchlist-failed' : ''}`}
                >
                  <div className="watchlist-item-left">
                    <span className="watchlist-symbol">{item.symbol}</span>
                    {item._failed ? (
                      <>
                        <span className="watchlist-price mono">—</span>
                        <span className="watchlist-change mono">—</span>
                        <button
                          className="watchlist-retry"
                          onClick={() => handleRetry(item.symbol)}
                          title="Retry loading ticker"
                        >
                          ↻ Retry
                        </button>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <span className="watchlist-tags">
                        {item.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="tag-pill small">#{tag}</span>
                        ))}
                        {item.tags.length > 2 && (
                          <span className="tag-overflow">+{item.tags.length - 2}</span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="watchlist-item-right">
                    <button
                      className="watchlist-tag-btn"
                      onClick={(e) => { e.stopPropagation(); setEditingTagsFor(item.symbol); }}
                      title="Edit tags"
                    >
                      🏷
                    </button>
                    {editingTagsFor === item.symbol && (
                      <TagEditor
                        currentTags={item.tags || []}
                        onSave={async (newTags) => {
                          await api.set_ticker_tags(item.symbol, newTags);
                          setEditingTagsFor(null);
                          onRangeChange(rangeRef.current, true);
                        }}
                        onClose={() => setEditingTagsFor(null)}
                      />
                    )}
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
