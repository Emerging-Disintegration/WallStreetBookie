// Most active options chains by volume
import { useState, useEffect } from 'react';
import GlowCard from './GlowCard';

export default function MostActiveTable({ api, watchlistTickers = [], onToggleFavorite }) {
  const [chains, setChains] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!api) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const res = await api.get_active_stocks();
        if (res.success) {
          setChains(res.data);
        }
      } catch (e) {
        // silently skip fetch failure
      }
      setLoading(false);
    };

    loadData();
  }, [api]);

  const handleRetry = async () => {
    if (!api) return;
    setLoading(true);
    try {
      const res = await api.get_active_stocks();
      if (res.success) {
        setChains(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch active chains:', e);
    }
    setLoading(false);
  };

  const toggleFavorite = async (e, ticker) => {
    e.stopPropagation();
    const symbol = ticker.toUpperCase();
    const wasInWatchlist = isFaved(symbol);

    if (wasInWatchlist) {
      setChains(prev => prev.map(c => c.ticker === symbol ? { ...c, _removing: true } : c));
    }

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
  };

  const isFaved = (ticker) =>
    watchlistTickers.some((t) => t.symbol === ticker.toUpperCase());

  return (
    <GlowCard className="active-card">
      <div className="active-header">
        <span className="active-label">
          MOST ACTIVE OPTIONS CHAINS BY VOLUME
        </span>
      </div>
      {loading ? (
        <div className="loading">Loading active chains...</div>
      ) : chains.length === 0 ? (
        <div className="active-empty">
          <p>Sorry, we couldn't fetch the most active chains right now.</p>
          <button onClick={handleRetry} className="btn-retry">
            Try Again
          </button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
          <caption className="sr-only">Most active options chains ranked by volume</caption>
          <thead>
            <tr>
              <th className="col-star"></th>
              <th className="col-rank">#</th>
              <th>Ticker</th>
              <th>Total Vol</th>
              <th>Calls</th>
              <th>Puts</th>
              <th>P/C Ratio</th>
            </tr>
          </thead>
          <tbody>
            {chains.map((chain, i) => {
              const rankClass = i < 3 ? 'rank-top' : 'rank';
              const callVol = chain.callVolume || chain.calls || 0;
              const putVol = chain.putVolume || chain.puts || 0;
              const total = chain.totalVolume || callVol + putVol;
              const ratio = callVol > 0 ? (putVol / callVol).toFixed(2) : '—';
              const isBull = parseFloat(ratio) <= 0.7;

              return (
                <tr key={i}>
                  <td>
                    <button
                      className={`fav-btn${isFaved(chain.ticker) ? ' active' : ''}`}
                      onClick={(e) => toggleFavorite(e, chain.ticker)}
                      disabled={chain._removing}
                      aria-label={isFaved(chain.ticker) ? 'Remove from watchlist' : 'Add to watchlist'}
                    >
                      {isFaved(chain.ticker) ? '★' : '☆'}
                    </button>
                  </td>
                  <td className={`${rankClass} col-rank`}>
                    {i + 1}
                  </td>
                  <td className="ticker">{chain.ticker || chain}</td>
                  <td className="mono vol-total">
                    {formatVolume(total)}
                  </td>
                  <td className="mono vol-call">{formatVolume(callVol)}</td>
                  <td className="mono vol-put">{formatVolume(putVol)}</td>
                  <td className={`mono ${isBull ? 'ratio-bull' : 'ratio-bear'}`}>
                    {ratio}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}
    </GlowCard>
  );
}

// Format large volume numbers
function formatVolume(num) {
  if (typeof num !== 'number' || isNaN(num)) return '—';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return num.toLocaleString();
}
