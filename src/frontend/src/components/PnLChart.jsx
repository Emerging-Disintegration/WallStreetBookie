// P/L chart — shows profit/loss at different underlying prices
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, ReferenceLine, Tooltip, Legend
} from 'recharts';
import TradeAudit from './TradeAudit';

// format dollar values with sign for Y-axis
function formatPnL(v) {
  if (v === 0) return '$0';
  const sign = v > 0 ? '+$' : '-$';
  return `${sign}${Math.abs(v).toLocaleString()}`;
}

// custom Y-axis tick — shifts bottom tick up to avoid X-axis collision
const CustomYAxisTick = ({ x, y, payload, index, ...props }) => {
  const fontSize = props.fontSize || 11;
  const offsetY = index === 0 ? -10 : 0;
  return (
    <text
      x={x}
      y={y + offsetY}
      textAnchor="end"
      fill="#777"
      fontSize={fontSize}
      fontFamily="Fira Code, monospace"
    >
      {formatPnL(payload.value)}
    </text>
  );
};

// custom X-axis tick
const CustomXAxisTick = ({ x, y, payload, ...props }) => {
  const fontSize = props.fontSize || 11;
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill="#777"
      fontSize={fontSize}
      fontFamily="Fira Code, monospace"
    >
      {`$${Math.round(payload.value)}`}
    </text>
  );
};

// compute round-number ticks for an axis
function niceTickValues(data, key = 'price', targetTicks = 12) {
  if (!data || data.length < 2) return undefined;
  const values = data.map((d) => d[key]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  if (range <= 0) return undefined;

  const rawStep = range / targetTicks;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const steps = [1, 2, 2.5, 5, 10];
  const step = steps.find((s) => s * magnitude >= rawStep) * magnitude;

  const start = Math.floor(min / step) * step;
  const ticks = [];
  for (let v = start; v <= max + (step * 0.1); v += step) {
    ticks.push(parseFloat(v.toFixed(10)));
  }
  // drop ticks below data range to prevent phantom edge labels
  const filtered = ticks.filter((t) => t >= min);
  return filtered.length > 1 ? filtered : undefined;
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

// helper component to sync tooltip data with external metrics bar
const SyncTooltip = ({ active, payload, setHoveredPoint }) => {
  useEffect(() => {
    if (active && payload && payload.length > 0) {
      setHoveredPoint(payload[0].payload);
    } else {
      setHoveredPoint(null);
    }
  }, [active, payload, setHoveredPoint]);
  return null;
};

export default function PnLChart({
  data, currentPrice: initialCurrentPrice, premium, optionType, ticker, strike, maxDte, onDteChange,
  api, bid, volume, openInterest, iv
}) {
  const [sliderPos, setSliderPos] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(initialCurrentPrice);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 480);
  const trailingRef = useRef(null);
  const lastCallRef = useRef(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 480);
    window.addEventListener('resize', handleResize);
    return () => {
      if (trailingRef.current) clearTimeout(trailingRef.current);
      window.removeEventListener('resize', handleResize);
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
    setHoveredPoint(null);
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
    // throttle: fire immediately if 50ms+ since last call, schedule trailing call otherwise
    const now = Date.now();
    if (now - lastCallRef.current >= 50) {
      lastCallRef.current = now;
      if (onDteChange) onDteChange(maxDte - pos);
    } else {
      if (trailingRef.current) clearTimeout(trailingRef.current);
      trailingRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        if (onDteChange) onDteChange(maxDte - pos);
      }, 50);
    }
  }, [onDteChange, maxDte]);

  if (!pnlData || pnlData.length === 0) return null;

  const ticks = niceTickValues(pnlData);

  // Y-axis ticks — 6 round values, always include breakeven at 0
  let yTicks = niceTickValues(pnlData, 'pnl', 6) || [];
  if (!yTicks.includes(0)) {
    yTicks = [...yTicks, 0].sort((a, b) => a - b);
  }

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

  // closest data point to the actual stock price — used as the default display
  const defaultPoint = pnlData.reduce((closest, d) =>
    Math.abs(d.price - currentPrice) < Math.abs(closest.price - currentPrice) ? d : closest
  , pnlData[0]);

  const displayPoint = hoveredPoint ?? defaultPoint;

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

      <div className="pnl-chart-body" style={{ display: 'flex', justifyContent: 'center' }}>
        <ResponsiveContainer width="100%" height={isMobile ? 140 : 250}>
        <AreaChart
          data={pnlData}
          margin={isMobile ? { top: 5, right: 5, bottom: 12, left: 5 } : { top: 30, right: 20, bottom: 45, left: 20 }}
        >
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
            tick={<CustomXAxisTick fontSize={isMobile ? 10 : 11} />}
            axisLine={false}
            tickLine={false}
            ticks={ticks}
            interval={0}
            minTickGap={20}
            label={isMobile ? null : { value: 'Stock Price', position: 'insideBottom', offset: -5, fill: 'var(--text-primary)', fontFamily: 'Fira Code, monospace', fontSize: 11 }}
          />
          <YAxis
            tick={<CustomYAxisTick fontSize={isMobile ? 10 : 11} />}
            axisLine={false}
            tickLine={false}
            width={isMobile ? 45 : 100}
            domain={['auto', 'auto']}
            ticks={yTicks}
            label={isMobile ? null : { value: 'Profit/Loss', angle: -90, position: 'center', fill: 'var(--text-primary)', fontFamily: 'Fira Code, monospace', fontSize: 11, dx: -40 }}
          />
          <Area
            type="linear"
            dataKey="pnl"
            stroke={`url(#stroke-${gradId})`}
            strokeWidth={2}
            fill={`url(#fill-${gradId})`}
            dot={false}
            activeDot={{ r: 8, fill: '#fff', strokeWidth: 0 }}
            isAnimationActive={false}
          />
            {/* breakeven line at P/L = 0 */}
          <ReferenceLine
            y={0}
            stroke="var(--yellow, #ffbe0b)"
            strokeDasharray="6 4"
            strokeWidth={1}
            label={isMobile ? undefined : { value: 'Breakeven', position: 'insideTopRight', fill: '#ffbe0b', fontFamily: 'Fira Code, monospace', fontSize: 11 }}
          />
          {/* strike price */}
          <ReferenceLine
            x={strike}
            stroke='#790dd870'
            strokeWidth={1}
            label={isMobile ? undefined : { value: `Strike: $${strike}`, position: 'insideBottomRight', fill: 'var(--purple)', fontFamily: 'Fira Code, monospace', fontSize: 10 }}
          />
          <Tooltip
            trigger="axis"
            content={<SyncTooltip setHoveredPoint={setHoveredPoint} />}
            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
            isAnimationActive={false}
          />
          {!isMobile && <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={{ paddingTop: '10px', fontFamily: 'Fira Code, monospace', fontSize: '11px' }} />}
        </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* HUD - moved below chart */}
      <div className="pnl-metrics">
        <div className="pnl-metric">
          <span className="pnl-metric-label">Stock Price:</span>
          <span className="pnl-metric-value mono">${displayPoint.price.toFixed(2)}</span>
        </div>
        <div className="pnl-metric">
          <span className="pnl-metric-label">P/L:</span>
          <span className={`pnl-metric-value mono ${displayPoint.pnl >= 0 ? 'profit' : 'loss'}`}>
            {displayPoint.pnl >= 0 ? '+' : ''}${displayPoint.pnl.toFixed(2)}
          </span>
        </div>
        <div className="pnl-metric">
          <span className="pnl-metric-label">Contract Value:</span>
          <span className="pnl-metric-value mono">${displayPoint.value.toFixed(2)}</span>
        </div>
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
            onMouseDown={() => window.pywebview.api.enable_easy_drag(false)}
            onMouseEnter={(e) => {
              if (e.buttons === 0) window.pywebview.api.enable_easy_drag(false);
            }}
            onMouseLeave={(e) => {
              if (e.buttons === 0) window.pywebview.api.enable_easy_drag(true);
            }}
            onMouseUp={() => window.pywebview.api.enable_easy_drag(true)}
            aria-label={`Days to expiration: ${formatDte(displayDte)}`}
          />
          <span className="pnl-slider-value">{formatDte(displayDte)}</span>
        </div>
      </div>

      {api && (
        <TradeAudit
          api={api}
          tradeParams={{
            ticker,
            strike,
            optionType,
            dte: displayDte,
            iv: iv || 0.3,
            bid: bid || 0,
            ask: premium || 0,
            volume: volume || 0,
            openInterest: openInterest || 0,
            currentPrice: currentPrice
          }}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
