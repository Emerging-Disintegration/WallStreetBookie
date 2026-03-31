// P/L chart — shows profit/loss at different underlying prices
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, ReferenceLine, Tooltip
} from 'recharts';

function PnLTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { price, pnl, value } = payload[0].payload;
  const inProfit = pnl >= 0;

  return (
    <div className="pnl-tooltip">
      <div className="pnl-tooltip-price">Stock Price: ${price.toFixed(2)}</div>
      <div className={`pnl-tooltip-pnl ${inProfit ? 'profit' : 'loss'}`}>
        P/L: {inProfit ? '+' : ''}${pnl.toFixed(2)}
      </div>
      <div className="pnl-tooltip-value">Contract Value: ${value.toFixed(2)}</div>
    </div>
  );
}

// format dollar values with sign for Y-axis
function formatPnL(v) {
  if (v === 0) return '$0';
  const sign = v > 0 ? '+$' : '-$';
  return `${sign}${Math.abs(v).toLocaleString()}`;
}

// compute round-number ticks for the X-axis
function niceTickValues(data, key = 'price') {
  if (!data || data.length < 2) return undefined;
  const values = data.map((d) => d[key]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  if (range <= 0) return undefined;

  const targetTicks = 12;
  const rawStep = range / targetTicks;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const steps = [1, 2, 2.5, 5, 10];
  let step = steps.find((s) => s * magnitude >= rawStep) * magnitude;

  const start = Math.ceil(min / step) * step;
  const ticks = [];
  for (let v = start; v <= max; v += step) {
    ticks.push(parseFloat(v.toFixed(2)));
  }
  return ticks.length > 1 ? ticks : undefined;
}

// format DTE float into human-readable label
function formatDte(dte) {
  if (dte <= 0) return 'At Expiry';
  if (dte >= 1) return `${Math.round(dte)}d`;
  const totalMinutes = Math.round(dte * 24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function PnLChart({
  data, currentPrice: initialCurrentPrice, premium, optionType, ticker, strike, maxDte, onDteChange
}) {
  const [sliderPos, setSliderPos] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(initialCurrentPrice);
  const debounceRef = useRef(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // reset state when a new row is clicked
  const [prevStrike, setPrevStrike] = useState(strike);
  const [prevTicker, setPrevTicker] = useState(ticker);
  if (strike !== prevStrike || ticker !== prevTicker) {
    setPrevStrike(strike);
    setPrevTicker(ticker);
    setSliderPos(0);
    setCurrentPrice(initialCurrentPrice);
  }

  const displayDte = maxDte - sliderPos;
  const costBasis = (premium || 0) * 100;

  // transform contract value → P/L
  const pnlData = useMemo(() => {
    if (!data) return [];
    return data.map((d) => ({
      price: d.price,
      value: d.value,
      pnl: Math.round((d.value - costBasis) * 100) / 100,
    }));
  }, [data, costBasis]);

  const handleSliderChange = useCallback((e) => {
    const pos = parseFloat(e.target.value);
    setSliderPos(pos);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (onDteChange) onDteChange(maxDte - pos);
    }, 150);
  }, [onDteChange, maxDte]);

  if (!pnlData || pnlData.length === 0) return null;

  const prices = pnlData.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const ticks = niceTickValues(pnlData);
  const optLabel = optionType ? optionType.charAt(0).toUpperCase() + optionType.slice(1).toLowerCase() : '';

  // gradient split at Y=0 (breakeven)
  const pnlValues = pnlData.map((d) => d.pnl);
  const pnlMax = Math.max(...pnlValues);
  const pnlMin = Math.min(...pnlValues);
  const pnlRange = pnlMax - pnlMin;

  let splitOffset;
  if (pnlRange <= 0) {
    splitOffset = pnlMin >= 0 ? 1 : 0;
  } else if (pnlMin >= 0) {
    splitOffset = 1; // all profit
  } else if (pnlMax <= 0) {
    splitOffset = 0; // all loss
  } else {
    // fraction from top where P/L crosses 0
    splitOffset = pnlMax / pnlRange;
  }

  // unique gradient IDs to prevent SVG collisions
  const gradId = `${ticker}-${strike}`;

  return (
    <div className="pnl-chart-wrapper">
      <div className="pnl-chart-header">
        <div className="pnl-chart-title">
          Long {optLabel}{ticker ? ` — ${ticker.toUpperCase()}` : ''}
        </div>
        <div className="pnl-chart-subtitle">
          ${strike} Strike · DTE: {formatDte(displayDte)}
        </div>
      </div>

      <div className="pnl-chart-body">
        <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={pnlData} margin={{ top: 20, right: 20, bottom: 25, left: 10 }}>
          <defs>
            <linearGradient id={`stroke-${gradId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset={splitOffset} stopColor="var(--green, #00ff88)" />
              <stop offset={splitOffset} stopColor="var(--red, #ff3b5c)" />
            </linearGradient>
            <linearGradient id={`fill-${gradId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00ff88" stopOpacity={0.18} />
              <stop offset={`${splitOffset * 100}%`} stopColor="#00ff88" stopOpacity={0.06} />
              <stop offset={`${splitOffset * 100}%`} stopColor="#ff3b5c" stopOpacity={0.06} />
              <stop offset="100%" stopColor="#ff3b5c" stopOpacity={0.18} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
          <XAxis
            dataKey="price"
            type="number"
            domain={['dataMin', 'dataMax']}
            tick={{ fill: '#777', fontSize: 11, fontFamily: 'Fira Code, monospace' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${Math.round(v)}`}
            ticks={ticks}
          />
          <YAxis
            tick={{ fill: '#777', fontSize: 11, fontFamily: 'Fira Code, monospace' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatPnL}
            width={80}
            domain={['auto', 'auto']}
          />
          <Area
            type="linear"
            dataKey="pnl"
            stroke={`url(#stroke-${gradId})`}
            strokeWidth={2}
            fill={`url(#fill-${gradId})`}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
          {/* breakeven line at P/L = 0 */}
          <ReferenceLine
            y={0}
            stroke="var(--yellow, #ffbe0b)"
            strokeDasharray="6 4"
            strokeWidth={1}
            label={{ value: 'Breakeven', position: 'insideTopRight', fill: '#ffbe0b', fontFamily: 'Fira Code, monospace', fontSize: 11 }}
          />
          {/* current stock price */}
          <ReferenceLine
            x={currentPrice}
            stroke="#00d4ff"
            strokeDasharray="3 3"
            strokeWidth={1}
            label={{ value: `Price: $${currentPrice.toFixed(2)}`, position: 'insideTopLeft', fill: '#00d4ff', fontFamily: 'Fira Code, monospace', fontSize: 11 }}
          />
          {/* strike price */}
          <ReferenceLine
            x={strike}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1}
            label={{ value: `Strike: $${strike}`, position: 'insideBottomRight', fill: 'rgba(255,255,255,0.3)', fontFamily: 'Fira Code, monospace', fontSize: 10 }}
          />
          <Tooltip
            content={<PnLTooltip />}
            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
            isAnimationActive={false}
          />
        </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="pnl-sliders">
        <div className="pnl-slider-row">
          <span className="pnl-slider-label">DTE</span>
          <input
            type="range"
            className="pnl-slider"
            min="0"
            max={maxDte}
            step="0.01"
            value={sliderPos}
            onChange={handleSliderChange}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label={`Days to expiration: ${formatDte(displayDte)}`}
          />
          <span className="pnl-slider-value">{formatDte(displayDte)}</span>
        </div>
      </div>
    </div>
  );
}
