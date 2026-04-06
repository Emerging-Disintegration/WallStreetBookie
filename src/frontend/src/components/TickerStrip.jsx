// Market ticker strip — SPY, QQQ, IWM
import { useState, useEffect } from 'react';

const DEFAULT_TICKERS = ['SPY', 'QQQ', 'IWM'];

export default function TickerStrip({ api, onVixData, symbols }) {
  const tickers = symbols && symbols.length > 0 ? symbols : DEFAULT_TICKERS;
  const [data, setData] = useState({});

  useEffect(() => {
    if (!api) return;
    let cancelled = false;

    const fetchAll = async () => {
      for (const ticker of tickers) {
        try {
          const res = await api.get_stock_card_data(ticker);
          if (!cancelled && res.success) {
            setData(prev => ({ ...prev, [ticker]: res.data }));
          }
        } catch {
          // silently skip failed ticker fetches
        }
      }
      try {
        const vixRes = await api.get_vix_value();
        if (!cancelled && vixRes.success && onVixData) {
          onVixData({
            ticker: 'VIX',
            price: vixRes.data.price,
            change: vixRes.data.change || 0,
          });
        }
      } catch {
        // silently skip VIX fetch failure
      }
    };

    fetchAll();
    return () => { cancelled = true; };
     
  }, [api, tickers]);

  return (
    <div className="ticker-strip">
      {tickers.map((sym) => {
        const item = data[sym];
        if (!item) {
          return (
            <div key={sym} className="ticker-item">
              <span className="ticker-symbol">{sym}</span>
              <span className="ticker-price mono">—</span>
            </div>
          );
        }

        const change = Number(item.change) || 0;
        const price = Number(item.price) || 0;
        const isUp = change >= 0;
        const direction = isUp ? 'up' : 'down';
        const sign = isUp ? '+' : '';
        const changeStr = `${sign}${change.toFixed(2)}%`;

        return (
          <div key={sym} className={`ticker-item ${direction}`}>
            <span className="ticker-symbol">{sym}</span>
            <span className="ticker-price mono">
              {price.toFixed(2)}
            </span>
            <span className={`ticker-change mono ${direction}`}>
              {changeStr}
            </span>
          </div>
        );
      })}
    </div>
  );
}
