// Most active options chains by volume
import { useState, useEffect } from 'react';
import GlowCard from './GlowCard';

export default function MostActiveTable({ api }) {
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
        console.error('Failed to fetch active chains:', e);
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
        <div className="empty-state">
          <p>Sorry, we couldn't fetch the most active chains right now.</p>
          <button onClick={handleRetry} className="btn-secondary" style={{ marginTop: '1rem' }}>
            Try Again
          </button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
          <caption className="sr-only">Most active options chains ranked by volume</caption>
          <thead>
            <tr>
              <th style={{ textAlign: 'center' }}>#</th>
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
              const ratio = putVol > 0 ? (callVol / putVol).toFixed(2) : '—';
              const isBull = parseFloat(ratio) >= 1;

              return (
                <tr key={i}>
                  <td className={rankClass} style={{ textAlign: 'center' }}>
                    {i + 1}
                  </td>
                  <td className="ticker">{chain.ticker || chain}</td>
                  <td className="mono" style={{ color: 'var(--green)' }}>
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
  if (typeof num !== 'number') return num;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return num.toLocaleString();
}
