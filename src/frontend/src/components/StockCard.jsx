// Displays a ticker's live price and percent change

import { useState, useEffect } from 'react';

export default function StockCard({ ticker, api }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!api) return;

    const fetchData = async () => {
      setLoading(true);
      const result = await api.get_stock_card_data(ticker);
      if (result.success) setData(result.data);
      setLoading(false);
    };

    fetchData();
  }, [api, ticker]);

  const isNegative = data?.change?.startsWith('-');
  const changeClass = isNegative ? 'negative' : 'positive';
  const arrow = isNegative ? '▼' : '▲';

  return (
    <div className="stock-card">
      <div className="stock-card-inner">
        {loading ? (
          <div className="stock-card-loading">Loading...</div>
        ) : (
          <>
            <div className="stock-card-header">
              <div className="stock-card-ticker">{ticker}</div>
              <div className={`stock-card-change ${changeClass}`}>
                <span>{data?.change}</span>
                <span className="arrow">{arrow}</span>
              </div>
            </div>
            <div className="stock-card-price mono">{data?.price}</div>
            <hr className="stock-card-divider" />
          </>
        )}
      </div>
    </div>
  );
}
