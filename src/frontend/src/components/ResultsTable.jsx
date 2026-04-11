// Scan results table with favorite star toggle and inline P/L chart
import { useState, useRef, Fragment, useEffect } from 'react';
import GlowCard from './GlowCard';
import PnLChart from './PnLChart';

export default function ResultsTable({ results, watchlistTickers = [], onToggleFavorite, api, expiration }) {
  const [togglingTickers, setTogglingTickers] = useState({});
  const [expandedRow, setExpandedRow] = useState(null);
  const [pnlData, setPnlData] = useState(null);
  const [pnlLoading, setPnlLoading] = useState(false);
  const [maxDte, setMaxDte] = useState(30);
  const requestCounter = useRef(0);
  const chartRowRef = useRef(null);

  // Scroll chart into view when it appears
  useEffect(() => {
    if (pnlData && chartRowRef.current) {
      chartRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [pnlData]);

  if (!results || results.length === 0) return null;

  const isFaved = (ticker) =>
    watchlistTickers.some((t) => t.symbol === ticker.toUpperCase());

  const toggleFavorite = async (e, ticker) => {
    e.stopPropagation();
    const symbol = ticker.toUpperCase();
    const wasInWatchlist = isFaved(symbol);

    setTogglingTickers((prev) => ({ ...prev, [symbol]: true }));

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

    setTogglingTickers((prev) => ({ ...prev, [symbol]: false }));
  };

  // parse IV from row data: "35.1%" → 0.351
  const getRowIv = (row) => {
    const rawIv = row.iv || row.IV;
    if (!rawIv) {
      console.warn('IV missing from row data, using 30% default', row);
    }
    const raw = String(rawIv || '30').replace('%', '');
    return parseFloat(raw) / 100;
  };

  // index ETFs get a tighter price range on the chart
  const INDEX_ETFS = new Set(['SPY', 'IWM', 'QQQ', 'DIA']);
  const getRangePct = (ticker) => INDEX_ETFS.has(ticker.toUpperCase()) ? 0.03 : 0.20;

  // derive stock price from strike + ITM amount
  const getStockPrice = (row) => {
    const strike = parseFloat(row.strike || row.Strike) || 0;
    const itm = parseFloat(row.itmPrice || row['ITM Price']) || 0;
    const side = (row.side || row.Side || '').toLowerCase();
    return side === 'call' ? strike + itm : strike - itm;
  };

  const handleRowClick = async (row, index) => {
    // Toggle off if clicking the same row
    if (expandedRow === index) {
      setExpandedRow(null);
      setPnlData(null);
      return;
    }

    setExpandedRow(index);
    setPnlLoading(true);
    setPnlData(null);

    const thisRequest = ++requestCounter.current;

    try {
      const strike = row.strike || row.Strike;
      const optionType = row.side || row.Side;
      const currentPrice = getStockPrice(row);
      const iv = getRowIv(row);

      const ticker = row.ticker || row.Ticker;
      const rangePct = getRangePct(ticker);
      const res = await api.get_value_curve(strike, optionType, currentPrice, expiration, null, iv, rangePct);

      if (requestCounter.current !== thisRequest) return;

      if (res.success) {
        setPnlData(res.data);
        setMaxDte(res.data.maxDte || 30);
      }
    } catch (e) {
      if (requestCounter.current !== thisRequest) return;
    }

    if (requestCounter.current === thisRequest) {
      setPnlLoading(false);
    }
  };

  const handleDteChange = async (newDte) => {
    if (expandedRow === null) return;
    const row = results[expandedRow];
    const thisRequest = ++requestCounter.current;

    try {
      const strike = row.strike || row.Strike;
      const optionType = row.side || row.Side;
      const currentPrice = getStockPrice(row);
      const iv = getRowIv(row);

      const ticker = row.ticker || row.Ticker;
      const rangePct = getRangePct(ticker);
      const res = await api.get_value_curve(strike, optionType, currentPrice, '', newDte, iv, rangePct);

      if (requestCounter.current !== thisRequest) return;

      if (res.success) {
        setPnlData(res.data);
      }
    } catch (e) {
      if (requestCounter.current !== thisRequest) return;
    }
  };

  const COL_COUNT = 11;

  return (
    <>
    <h2 className="results-title">RESULTS</h2>
    <GlowCard className="results-card">
      <div className="results-header">
        <span className="results-count">
          {results.length} contract{results.length !== 1 ? 's' : ''} found
        </span>
      </div>
      <div className="table-scroll-container">
        <table>
          <caption className="sr-only">Options scan results</caption>
          <thead>
            <tr>
              <th className="fav-header">☆</th>
              <th>Ticker</th>
              <th>Strike</th>
              <th>Last</th>
              <th>Bid</th>
              <th>Ask</th>
              <th>OI</th>
              <th>Side</th>
              <th>IV</th>
              <th>ITM Price</th>
              <th className="gain-header">% Gain</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row, i) => {
              const ticker = row.ticker || row.Ticker;
              const faved = isFaved(ticker);
              const toggling = togglingTickers[ticker.toUpperCase()];
              const isExpanded = expandedRow === i;

              return (
                <Fragment key={i}>
                  <tr
                    className={`expandable-row${isExpanded ? ' expanded' : ''}`}
                    onClick={() => handleRowClick(row, i)}
                  >
                    <td className="fav-cell">
                      <button
                        className={`fav-btn${faved ? ' active' : ''}`}
                        aria-label={faved ? `Remove ${ticker} from watchlist` : `Add ${ticker} to watchlist`}
                        onClick={(e) => toggleFavorite(e, ticker)}
                        disabled={toggling}
                      >
                        {faved ? '\u2605' : '\u2606'}
                      </button>
                    </td>
                    <td className="ticker">{ticker}</td>
                    <td className="mono">{row.strike || row.Strike}</td>
                    <td className="mono">{row.last || row.Last}</td>
                    <td className="mono">{row.bid || row.Bid}</td>
                    <td className="mono">{row.ask || row.Ask}</td>
                    <td className="mono">{row.openInterest || row.OI}</td>
                    <td className={row.side === 'call' || row.Side === 'call' ? 'call' : 'put'}>
                      {row.side || row.Side}
                    </td>
                    <td className="mono">{row.iv || row.IV}</td>
                    <td className="mono">{row.itmPrice || row['ITM Price']}</td>
                    <td className="gain mono">{row.gain || row['% Gain']}</td>
                  </tr>
                  {isExpanded && (
                    <tr className="pnl-chart-row" ref={chartRowRef}>
                      <td colSpan={COL_COUNT} className="pnl-chart-cell">
                        <div className={`pnl-chart-container${pnlData || pnlLoading ? ' open' : ''}`}>
                          {pnlLoading && !pnlData && (
                            <div className="pnl-loading">Calculating contract value...</div>
                          )}
                          {pnlData && (
                            <PnLChart
                              data={pnlData.points}
                              currentPrice={pnlData.currentPrice}
                              premium={parseFloat(row.ask || row.Ask)}
                              optionType={row.side || row.Side}
                              ticker={row.ticker || row.Ticker}
                              strike={parseFloat(row.strike || row.Strike)}
                              maxDte={maxDte}
                              onDteChange={handleDteChange}
                              api={api}
                              bid={parseFloat(row.bid || row.Bid || 0)}
                              volume={parseInt(row.volume || row.Volume || 0)}
                              openInterest={parseInt(row.openInterest || row.OI || 0)}
                              iv={getRowIv(row)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlowCard>
    </>
  );
}
