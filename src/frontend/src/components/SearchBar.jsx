// Search inputs for ticker, expiration, and desired profit

import { useState } from 'react';

export default function SearchBar({ onSearch, loading }) {
  const [ticker, setTicker] = useState('');
  const [expiration, setExpiration] = useState('');
  const [desiredProfit, setDesiredProfit] = useState('');

  const handleSubmit = () => {
    if (!ticker || !expiration || !desiredProfit) return;
    onSearch({
      ticker: ticker.toUpperCase(),
      expiration,
      desiredProfit: parseInt(desiredProfit, 10),
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="search-container">
      <div className="search-row">
        <input
          className="search-input"
          type="text"
          placeholder="Ticker"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <input
          className="search-input"
          type="text"
          placeholder="Expiration (MM/DD/YYYY)"
          value={expiration}
          onChange={(e) => setExpiration(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <input
          className="search-input"
          type="text"
          placeholder="Desired Profit %"
          value={desiredProfit}
          onChange={(e) => setDesiredProfit(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="search-button"
          onClick={handleSubmit}
          disabled={loading || !ticker || !expiration || !desiredProfit}
        >
          🔍 Search
        </button>
      </div>
    </div>
  );
}
