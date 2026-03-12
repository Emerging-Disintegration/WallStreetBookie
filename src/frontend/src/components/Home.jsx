// Main landing view — stock cards, option side toggle, VIX, and search bar

import { useState, useEffect } from 'react';
import StockCard from './StockCard';
import SearchBar from './SearchBar';

export default function Home({ api, onSearch, searchLoading }) {
  const [vix, setVix] = useState(null);
  const [optionSide, setOptionSide] = useState('Any');

  useEffect(() => {
    if (!api) return;

    const fetchVix = async () => {
      const result = await api.get_vix_value();
      if (result.success) setVix(result.data);
    };

    fetchVix();
  }, [api]);

  const handleSearch = (params) => {
    onSearch({ ...params, optionSide });
  };

  const sides = ['Calls', 'Puts', 'Any'];

  return (
    <div className="app-container">
      <div className="title-section">
        <h1>WallStreetBookie</h1>
        <p>
          Find High-Potential (and High Risk) trades instantly
          <br />
          Your shortcut to your next WallStreetBet
        </p>
      </div>

      <div className="card-row">
        <StockCard ticker="SPY" api={api} />
        <StockCard ticker="QQQ" api={api} />
        <StockCard ticker="IWM" api={api} />
      </div>

      <div className="middle-row">
        <div className="segmented-toggle">
          {sides.map((side) => (
            <button
              key={side}
              className={optionSide === side ? 'active' : ''}
              onClick={() => setOptionSide(side)}
            >
              {side}
            </button>
          ))}
        </div>
        <span className="vix-display">
          VIX: <span className="mono">{vix !== null ? vix : '...'}</span>
        </span>
      </div>

      <SearchBar onSearch={handleSearch} loading={searchLoading} />
    </div>
  );
}
