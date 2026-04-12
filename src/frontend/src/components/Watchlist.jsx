// Watchlist tab — shows saved tickers with price, change, and remove functionality
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import GlowCard from './GlowCard';
import ToggleGroup from './ToggleGroup';
import TagFilter from './TagFilter';
import TagEditor from './TagEditor';

const RANGES = ['1D', '5D', '1M', '6M', 'YTD', '1Y'];

export default function Watchlist({ tickers, onToggleFavorite, api }) {
  const [localTickers, setLocalTickers] = useState(null);
  const [range, setRange] = useState('1D');
  const rangeRef = useRef('1D');
  const [removing, setRemoving] = useState({});
  const [error, setError] = useState(null);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [sortDirection, setSortDirection] = useState('off');
  const [activeTag, setActiveTag] = useState(null);
  const [editingTagsFor, setEditingTagsFor] = useState(null);

  const fetchWithRange = useCallback(async (r) => {
    if (!api) return;
    setRangeLoading(true);
    try {
      const res = await api.get_watchlist_with_prices(r);
      if (res.success) setLocalTickers(res.data);
    } catch {
      // silently fail
    }
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
      if (res.success && onToggleFavorite) {
        onToggleFavorite(symbol, false);
      } else {
        setError(`Failed to remove ${symbol} from watchlist`);
      }
    } catch {
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

  const allTags = useMemo(() => {
    if (!displayTickers) return [];
    const tagSet = new Set();
    displayTickers.forEach(t => (t.tags || []).forEach(tag => tagSet.add(tag)));
    return [...tagSet].sort();
  }, [displayTickers]);

  // Filter by tag first, then sort by % change
  const displayList = useMemo(() => {
    if (!displayTickers) return [];
    let list = [...displayTickers];
    if (activeTag) {
      list = list.filter(t => (t.tags || []).includes(activeTag));
    }
    if (sortDirection === 'off') return list.reverse();
    return list.sort((a, b) => {
      const aVal = a.change ?? 0;
      const bVal = b.change ?? 0;
      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [displayTickers, activeTag, sortDirection]);

  if (!displayTickers) {
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
                {displayTickers.length} ticker{displayTickers.length !== 1 ? 's' : ''}
              </span>
            </div>
            <TagFilter tags={allTags} activeTag={activeTag} onTagSelect={setActiveTag} />
            <ul className={`watchlist-list${rangeLoading ? ' loading-dim' : ''}`}>
              {displayList.map((item) => (
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
                          fetchWithRange(rangeRef.current);
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
