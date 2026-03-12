import { useState } from 'react';

// ─── Color Tokens ───
const colors = {
  bg: '#0a0a0f',
  surface: '#12121a',
  surfaceHover: '#1a1a2e',
  border: '#2a2a3e',
  borderGlow: '#00ff8833',
  cyan: '#00ff88',
  magenta: '#ff006e',
  purple: '#b028ff',
  yellow: '#ffbe0b',
  textPrimary: '#e0e0e0',
  textSecondary: '#888',
  textMuted: '#555',
};

// ─── Reusable tiny components ───

const Mono = ({ children, color, size }) => (
  <span style={{
    fontFamily: '"SF Mono", "Fira Code", "Consolas", monospace',
    color: color || colors.cyan,
    fontSize: size || '0.95rem',
    letterSpacing: '0.02em',
  }}>{children}</span>
);

const GlowCard = ({ children, style, glowColor }) => (
  <div style={{
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: '16px 20px',
    boxShadow: `0 0 20px ${glowColor || colors.borderGlow}, inset 0 1px 0 rgba(255,255,255,0.03)`,
    backdropFilter: 'blur(10px)',
    ...style,
  }}>{children}</div>
);

const Badge = ({ children, color }) => (
  <span style={{
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 20,
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: colors.bg,
    background: color || colors.cyan,
  }}>{children}</span>
);

// ─── Tab Bar ───

const tabs = [
  { id: 'scanner', label: 'SCANNER' },
  { id: 'active', label: 'MOST ACTIVE' },
];

function TabBar({ active, onChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: 0,
      borderBottom: `1px solid ${colors.border}`,
      marginBottom: 24,
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            padding: '12px 28px',
            background: 'transparent',
            border: 'none',
            borderBottom: active === tab.id ? `2px solid ${colors.cyan}` : '2px solid transparent',
            color: active === tab.id ? colors.cyan : colors.textSecondary,
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
          }}
        >{tab.label}</button>
      ))}
    </div>
  );
}

// ─── Market Ticker Strip ───

function TickerStrip() {
  const tickers = [
    { symbol: 'SPY', price: '585.23', change: '+1.24%', up: true },
    { symbol: 'QQQ', price: '498.17', change: '-0.38%', up: false },
    { symbol: 'IWM', price: '221.05', change: '+0.82%', up: true },
    { symbol: 'VIX', price: '14.32', change: '-2.10%', up: false },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: 12,
      padding: '10px 0',
      borderBottom: `1px solid ${colors.border}`,
      marginBottom: 20,
    }}>
      {tickers.map(t => (
        <div key={t.symbol} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 16px',
          borderRadius: 8,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          flex: 1,
          minWidth: 0,
        }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: colors.textSecondary,
            letterSpacing: '0.08em',
          }}>{t.symbol}</span>
          <Mono size="0.85rem">{t.price}</Mono>
          <Mono size="0.75rem" color={t.up ? colors.cyan : colors.magenta}>
            {t.change}
          </Mono>
        </div>
      ))}
    </div>
  );
}

// ─── Profit Calculator (the hero) ───

function ProfitCalculator() {
  const [searchMode, setSearchMode] = useState('single'); // 'single' | 'top3'
  const [optionType, setOptionType] = useState('any');     // 'calls' | 'puts' | 'any'

  return (
    <GlowCard style={{ marginBottom: 24 }}>
      {/* Section header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: 700,
            color: colors.textPrimary,
            letterSpacing: '0.04em',
          }}>Profit Calculator</h2>
          <Badge>CORE</Badge>
        </div>

        {/* Search mode toggle: Single Stock vs Top 3 Active */}
        <ToggleGroup
          options={[
            { value: 'single', label: 'Single Stock' },
            { value: 'top3', label: 'Top 3 Active' },
          ]}
          active={searchMode}
          onChange={setSearchMode}
        />
      </div>

      {/* Input row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: searchMode === 'single'
          ? '1.5fr 1.5fr 1fr auto'
          : '1.5fr 1fr auto',
        gap: 12,
        alignItems: 'end',
        marginBottom: 16,
      }}>
        {searchMode === 'single' && (
          <InputField label="TICKER" placeholder="e.g. AAPL" />
        )}
        <InputField label="EXPIRATION" placeholder="" type="date" />
        <InputField label="TARGET GAIN %" placeholder="e.g. 100" />
        <button style={{
          padding: '10px 28px',
          background: `linear-gradient(135deg, ${colors.cyan}, ${colors.purple})`,
          border: 'none',
          borderRadius: 8,
          color: colors.bg,
          fontWeight: 700,
          fontSize: '0.85rem',
          letterSpacing: '0.06em',
          cursor: 'pointer',
          height: 42,
          whiteSpace: 'nowrap',
          boxShadow: `0 0 20px ${colors.cyan}44`,
        }}>SCAN</button>
      </div>

      {/* Option type toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          fontSize: '0.7rem',
          color: colors.textSecondary,
          letterSpacing: '0.1em',
          fontWeight: 600,
        }}>TYPE</span>
        <ToggleGroup
          options={[
            { value: 'any', label: 'Any' },
            { value: 'calls', label: 'Calls' },
            { value: 'puts', label: 'Puts' },
          ]}
          active={optionType}
          onChange={setOptionType}
          small
        />
      </div>
    </GlowCard>
  );
}

// ─── Toggle Group Component ───

function ToggleGroup({ options, active, onChange, small }) {
  return (
    <div style={{
      display: 'inline-flex',
      background: colors.bg,
      borderRadius: 8,
      padding: 3,
      gap: 2,
      border: `1px solid ${colors.border}`,
    }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: small ? '4px 14px' : '6px 18px',
            borderRadius: 6,
            border: 'none',
            background: active === opt.value ? colors.surfaceHover : 'transparent',
            color: active === opt.value ? colors.cyan : colors.textMuted,
            fontSize: small ? '0.7rem' : '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            transition: 'all 0.15s',
            fontFamily: 'inherit',
            boxShadow: active === opt.value ? `0 0 8px ${colors.cyan}22` : 'none',
          }}
        >{opt.label}</button>
      ))}
    </div>
  );
}

// ─── Input Field ───

function InputField({ label, placeholder, type = 'text' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: '0.65rem',
        fontWeight: 700,
        color: colors.textSecondary,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        style={{
          padding: '10px 14px',
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          color: colors.textPrimary,
          fontSize: '0.9rem',
          fontFamily: '"SF Mono", "Fira Code", monospace',
          outline: 'none',
          height: 42,
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

// ─── Results Table ───

function ResultsTable() {
  const columns = ['Ticker', 'Strike', 'Last', 'Bid', 'Ask', 'OI', 'Side', 'IV', 'ITM Price', '% Gain'];
  const rows = [
    ['AAPL', '195.00', '2.15', '2.10', '2.20', '12,453', 'Call', '32.1%', '7.35', '234%'],
    ['AAPL', '200.00', '0.85', '0.80', '0.90', '28,102', 'Call', '35.8%', '4.12', '358%'],
    ['AAPL', '205.00', '0.32', '0.28', '0.35', '8,891', 'Call', '38.2%', '2.88', '722%'],
    ['AAPL', '190.00', '1.45', '1.40', '1.50', '6,230', 'Put', '29.4%', '5.20', '247%'],
  ];

  return (
    <GlowCard style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{
        padding: '14px 20px',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: colors.textSecondary,
          letterSpacing: '0.1em',
        }}>RESULTS</span>
        <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>
          4 contracts found
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.82rem',
        }}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col} style={{
                  padding: '10px 16px',
                  textAlign: 'left',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: colors.textMuted,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  borderBottom: `1px solid ${colors.border}`,
                  whiteSpace: 'nowrap',
                }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{
                borderBottom: `1px solid ${colors.border}22`,
                transition: 'background 0.15s',
              }}>
                {row.map((cell, j) => (
                  <td key={j} style={{
                    padding: '10px 16px',
                    fontFamily: j > 0 ? '"SF Mono", "Fira Code", monospace' : 'inherit',
                    color: j === 0 ? colors.textPrimary
                      : j === row.length - 1 ? colors.cyan
                      : j === 6 ? (cell === 'Call' ? colors.cyan : colors.magenta)
                      : colors.textSecondary,
                    fontWeight: j === 0 || j === row.length - 1 ? 600 : 400,
                    whiteSpace: 'nowrap',
                  }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlowCard>
  );
}

// ─── Most Active Tab ───

function MostActiveView() {
  const chains = [
    { rank: 1, ticker: 'TSLA', volume: '1.2M', calls: '680K', puts: '520K', ratio: 1.31 },
    { rank: 2, ticker: 'NVDA', volume: '980K', calls: '590K', puts: '390K', ratio: 1.51 },
    { rank: 3, ticker: 'SPY', volume: '870K', calls: '410K', puts: '460K', ratio: 0.89 },
    { rank: 4, ticker: 'AAPL', volume: '654K', calls: '380K', puts: '274K', ratio: 1.39 },
    { rank: 5, ticker: 'AMD', volume: '521K', calls: '305K', puts: '216K', ratio: 1.41 },
    { rank: 6, ticker: 'META', volume: '498K', calls: '270K', puts: '228K', ratio: 1.18 },
    { rank: 7, ticker: 'AMZN', volume: '432K', calls: '248K', puts: '184K', ratio: 1.35 },
    { rank: 8, ticker: 'QQQ', volume: '389K', calls: '195K', puts: '194K', ratio: 1.01 },
  ];

  return (
    <GlowCard style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{
        padding: '14px 20px',
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: colors.textSecondary,
          letterSpacing: '0.1em',
        }}>MOST ACTIVE OPTIONS CHAINS BY VOLUME</span>
      </div>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.82rem',
      }}>
        <thead>
          <tr>
            {['#', 'Ticker', 'Total Vol', 'Calls', 'Puts', 'P/C Ratio'].map(col => (
              <th key={col} style={{
                padding: '10px 16px',
                textAlign: col === '#' ? 'center' : 'left',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: colors.textMuted,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                borderBottom: `1px solid ${colors.border}`,
              }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chains.map(c => (
            <tr key={c.rank} style={{
              borderBottom: `1px solid ${colors.border}22`,
            }}>
              <td style={{
                padding: '10px 16px',
                textAlign: 'center',
                color: c.rank <= 3 ? colors.yellow : colors.textMuted,
                fontWeight: 700,
                fontSize: '0.75rem',
              }}>{c.rank}</td>
              <td style={{
                padding: '10px 16px',
                color: colors.textPrimary,
                fontWeight: 600,
              }}>{c.ticker}</td>
              <td style={{
                padding: '10px 16px',
                fontFamily: '"SF Mono", "Fira Code", monospace',
                color: colors.cyan,
              }}>{c.volume}</td>
              <td style={{
                padding: '10px 16px',
                fontFamily: '"SF Mono", "Fira Code", monospace',
                color: colors.cyan,
                opacity: 0.8,
              }}>{c.calls}</td>
              <td style={{
                padding: '10px 16px',
                fontFamily: '"SF Mono", "Fira Code", monospace',
                color: colors.magenta,
                opacity: 0.8,
              }}>{c.puts}</td>
              <td style={{
                padding: '10px 16px',
                fontFamily: '"SF Mono", "Fira Code", monospace',
                color: c.ratio >= 1 ? colors.cyan : colors.magenta,
              }}>{c.ratio.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </GlowCard>
  );
}

// ─── Main App Layout ───

export default function DesignMockup() {
  const [tab, setTab] = useState('scanner');
  const [hasResults] = useState(true); // toggle to see with/without results

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bg,
      color: colors.textPrimary,
      fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
      padding: '0 clamp(20px, 4vw, 48px)',
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 0 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h1 style={{
            margin: 0,
            fontSize: '1.4rem',
            fontWeight: 800,
            background: `linear-gradient(135deg, ${colors.cyan}, ${colors.purple})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}>WallStreetBookie</h1>
          <span style={{
            fontSize: '0.6rem',
            color: colors.textMuted,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>v0.2</span>
        </div>
      </header>

      {/* Market ticker strip */}
      <TickerStrip />

      {/* Tab navigation */}
      <TabBar active={tab} onChange={setTab} />

      {/* Tab content */}
      {tab === 'scanner' && (
        <>
          <ProfitCalculator />
          {hasResults && <ResultsTable />}
        </>
      )}

      {tab === 'active' && (
        <MostActiveView />
      )}
    </div>
  );
}
