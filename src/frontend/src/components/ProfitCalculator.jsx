// Profit calculator card with search inputs
import { useState } from 'react';
import GlowCard from './GlowCard';
import ToggleGroup from './ToggleGroup';

export default function ProfitCalculator({ onSearch, loading }) {
  const [mode, setMode] = useState('Single Stock');
  const [optionType, setOptionType] = useState('Any');
  const [ticker, setTicker] = useState('');
  const [expiration, setExpiration] = useState('');
  const [targetGain, setTargetGain] = useState('');

  const isSingle = mode === 'Single Stock';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({
      mode: isSingle ? 'single' : 'top3',
      ticker: ticker.toUpperCase(),
      expiration,
      targetGain: parseInt(targetGain, 10),
      optionType,
    });
  };

  const canSubmit = expiration && targetGain && (isSingle ? ticker : true);

  return (
    <GlowCard className="calc-card">
      <div className="calc-header">
        <div className="calc-title-row">
          <h1 className="calc-title">Find Contracts</h1>
        </div>
        <ToggleGroup
          options={['Single Stock', 'Hottest Stocks']}
          value={mode}
          onChange={setMode}
        />
      </div>

      <form onSubmit={handleSubmit}>
        <div className={`input-row ${isSingle ? 'single' : 'top3'}`}>
          {isSingle && (
            <div className="input-field">
              <label htmlFor="ticker-input">Ticker</label>
              <input
                id="ticker-input"
                type="text"
                placeholder="e.g. AAPL"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                maxLength={10}
                autoComplete="off"
              />
            </div>
          )}
          <div className="input-field">
            <label htmlFor="expiration-input">Expiration</label>
            <input
              id="expiration-input"
              type="date"
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
            />
          </div>
          <div className="input-field">
            <label htmlFor="target-gain-input">Target Gain %</label>
            <input
              id="target-gain-input"
              type="text"
              inputMode="numeric"
              placeholder="e.g. 100"
              value={targetGain}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '' || /^\d+$/.test(v)) setTargetGain(v);
              }}
              maxLength={5}
            />
          </div>
          <button
            type="submit"
            className="scan-btn"
            disabled={!canSubmit || loading}
          >
            {loading ? 'SCANNING...' : 'SCAN'}
          </button>
        </div>
      </form>

      <div className="type-row">
        <span className="type-label">TYPE</span>
        <ToggleGroup
          options={['Any', 'Calls', 'Puts']}
          value={optionType}
          onChange={setOptionType}
          small
        />
      </div>
    </GlowCard>
  );
}
