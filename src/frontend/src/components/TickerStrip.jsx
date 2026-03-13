// Market ticker strip — SPY, QQQ, IWM, VIX
import { useState, useEffect } from 'react';

const TICKERS = ['SPY', 'QQQ', 'IWM'];

export default function TickerStrip({ api }) {
  const [data, setData] = useState({});

  useEffect(() => {
    if (!api) return;

    const fetchAll = async () => {
      // fetch ETFs
      for (const ticker of TICKERS) {
        try {
          const res = await api.get_stock_card_data(ticker);
          if (res.success) {
            setData(prev => ({ ...prev, [ticker]: res.data }));
          }
        } catch (e) {
          console.error(`Failed to fetch ${ticker}:`, e);
        }
      }
      // fetch VIX
      try {
        const vixRes = await api.get_vix_value();
        const changeRes = await api.get_change('^VIX');
        if (vixRes.success) {
          setData(prev => ({
            ...prev,
            VIX: {
              ticker: 'VIX',
              price: vixRes.data,
              change: changeRes.success ? changeRes.data : 0,
            },
          }));
        }
      } catch (e) {
        console.error('Failed to fetch VIX:', e);
      }
    };

    fetchAll();
  }, [api]);

  const allTickers = [...TICKERS, 'VIX'];

  return (
    <div className="ticker-strip">
      {allTickers.map((sym) => {
        const item = data[sym];
        if (!item) {
          return (
            <div key={sym} className="ticker-item">
              <span className="ticker-symbol">{sym}</span>
              <span className="ticker-price mono">—</span>
            </div>
          );
        }

        const isUp = item.change >= 0;
        const direction = isUp ? 'up' : 'down';
        const sign = isUp ? '+' : '';
        const changeStr = `${sign}${Number(item.change).toFixed(2)}%`;

        return (
          <div key={sym} className={`ticker-item ${direction}`}>
            <span className="ticker-symbol">{sym}</span>
            <span className="ticker-price mono">
              {Number(item.price).toFixed(2)}
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
