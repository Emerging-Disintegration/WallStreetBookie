import React, { useState } from 'react';

const BADGE_CONFIG = {
  liquidity: {
    key: 'is_hazardous',
    label: 'LIQUIDITY WARNING',
    icon: '🔴',
    safeLabel: 'LIQUIDITY OK'
  },
  feasibility: {
    key: 'is_unrealistic',
    label: 'MOON MATH',
    icon: '🟡',
    safeLabel: 'TARGET REALISTIC'
  },
  iv_crush: {
    key: 'is_high_risk',
    label: 'IV CRUSH RISK',
    icon: '🟠',
    safeLabel: 'IV NORMAL'
  }
};

const RISK_COLORS = {
  Low: 'var(--green)',
  Moderate: 'var(--yellow)',
  Extreme: 'var(--red)'
};

export default function TradeAudit({ api, tradeParams, isMobile }) {
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const containerClass = isMobile ? 'trade-audit-panel trade-audit-mobile' : 'trade-audit-panel';

  const runAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch the real current price from the API
      const priceRes = await api.get_stock_card_data(tradeParams.ticker);
      const currentPrice = priceRes.success ? parseFloat(priceRes.data.price) : tradeParams.currentPrice;

      const resp = await api.audit_trade(
        tradeParams.ticker,
        tradeParams.strike,
        tradeParams.optionType,
        tradeParams.dte,
        tradeParams.iv,
        tradeParams.bid,
        tradeParams.ask,
        tradeParams.volume,
        tradeParams.openInterest,
        currentPrice
      );
      if (resp.success) {
        setAudit(resp.data);
      } else {
        setError(resp.error);
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className={containerClass}>
      {!audit && !loading && (
        <button className="audit-btn" onClick={runAudit} disabled={loading}>
          Risk Analysis 
        </button>
      )}

      {loading && <div className="audit-loading">Analyzing Contract...</div>}

      {error && <div className="audit-error">{error}</div>}

      {audit && (
        <div className="audit-results">
          <div
            className="audit-overall"
            style={{ borderColor: RISK_COLORS[audit.overall_risk_level] }}
          >
            <span className="audit-risk-label">
              Risk: {audit.overall_risk_level}
            </span>
          </div>

          {Object.entries(BADGE_CONFIG).map(([key, cfg]) => {
            const check = audit[key];
            const isTriggered = check?.[cfg.key];
            return (
              <div
                key={key}
                className={`audit-badge ${isTriggered ? 'triggered' : 'safe'}`}
              >
                <span className="audit-badge-icon">
                  {isTriggered ? cfg.icon : '🟢'}
                </span>
                <span className="audit-badge-label">
                  {isTriggered ? cfg.label : cfg.safeLabel}
                </span>
                <span className="audit-badge-note">{check?.note}</span>
              </div>
            );
          })}

          <button className="audit-reset-btn" onClick={() => setAudit(null)}>
            Re-Analyze
          </button>
        </div>
      )}
    </div>
  );
}
