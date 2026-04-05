import { useState, useEffect } from 'react';

const THEMES = [
  { value: 'default', label: 'WallStreetBookie', desc: 'Dark Terminal, Glow, Neon' },
  { value: 'high-contrast-dark', label: 'High-Contrast Dark', desc: 'Pure black, Bright Text, Minimal borders' },
  { value: 'high-contrast-light', label: 'High-Contrast Light', desc: 'White Background, Bold Black Text' }
];

export default function Settings({ api, isOpen, onClose, onThemeChange, onTickerStripChange }) {
  const [settings, setSettings] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState(null);
  const [tickerInput, setTickerInput] = useState('');
  const [tickers, setTickers] = useState([]);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('default');
  const [saving, setSaving] = useState(false);

  // Load settings on open
  useEffect(() => {
    if (isOpen && api) {
      api.get_settings().then(resp => {
        if (resp.success) {
          setSettings(resp.data);
          setTickers(resp.data.ticker_strip || []);
          setTheme(resp.data.theme || 'default');
          // Reset API key field when opening
          setApiKey('');
          setVerifyStatus(null);
        }
      });
    }
  }, [isOpen, api]);

  const handleVerifyKey = async () => {
    if (!apiKey) return;
    setVerifying(true);
    setVerifyStatus(null);
    const resp = await api.verify_gemini_key(apiKey);
    setVerifyStatus(resp.success ? 'verified' : resp.error);
    setVerifying(false);
  };

  const addTicker = () => {
    const sym = tickerInput.trim().toUpperCase();
    if (!sym) return;
    
    if (tickers.length >= 3) {
      setError('Maximum of 3 tickers allowed');
      return;
    }
    
    if (tickers.includes(sym)) {
      setError('Ticker already added');
      return;
    }
    
    setTickers([...tickers, sym]);
    setTickerInput('');
    setError(null);
  };

  const removeTicker = (sym) => {
    setTickers(tickers.filter(t => t !== sym));
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      ticker_strip: tickers,
      theme: theme
    };
    // Only include API key if user entered a new one
    if (apiKey) payload.gemini_api_key = apiKey;
    await api.save_settings(payload);
    onThemeChange(theme);
    if (onTickerStripChange) {
      onTickerStripChange(tickers);
    }
    setSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="settings-backdrop" onClick={onClose}>
      <div className="settings-overlay" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        {/* Section 1: Gemini API Key */}
        <div className="settings-section">
          <h3>Gemini API Integration</h3>
          <p className="settings-desc">
            Required for the Trade Audit feature. Get a free key at
            aistudio.google.com.
          </p>
          <div className="settings-key-row">
            <input
              type={showKey ? 'text' : 'password'}
              className="settings-input"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={settings?.gemini_api_key_masked || 'Paste your API key...'}
            />
            <button
              className="settings-eye-btn"
              onClick={() => setShowKey(!showKey)}
              title={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? '🙈' : '👁'}
            </button>
            <button
              className="settings-verify-btn"
              onClick={handleVerifyKey}
              disabled={verifying || !apiKey}
            >
              {verifying ? '...' : 'Verify'}
            </button>
          </div>
          {verifyStatus && (
            <span className={`settings-verify-status ${verifyStatus === 'verified' ? 'success' : 'error'}`}>
              {verifyStatus === 'verified' ? '✓ Connected' : verifyStatus}
            </span>
          )}
          {settings?.has_gemini_key && !apiKey && (
            <span className="settings-verify-status success">✓ Key saved</span>
          )}
        </div>

        {/* Section 2: Ticker Strip */}
        <div className="settings-section">
          <div className="settings-ticker-header">
            <h3>Ticker Strip</h3>
            <span className="settings-ticker-count">{tickers.length}/3</span>
          </div>
          <p className="settings-desc">
            Customize the market tickers scrolling across the top bar.
          </p>
          <div className="settings-ticker-list">
            {tickers.map(sym => (
              <span key={sym} className="settings-ticker-pill">
                {sym}
                <button onClick={() => removeTicker(sym)} title={`Remove ${sym}`}>×</button>
              </span>
            ))}
            <input
              className="settings-ticker-input"
              value={tickerInput}
              onChange={e => {
                setTickerInput(e.target.value);
                setError(null);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') { addTicker(); e.preventDefault(); }
              }}
              placeholder={tickers.length >= 3 ? "Max 3" : "Add ticker..."}
              size={8}
              disabled={tickers.length >= 3}
            />
          </div>
          {error && <span className="settings-error">{error}</span>}
        </div>

        {/* Section 3: Theme */}
        <div className="settings-section">
          <h3>Theme</h3>
          <div className="settings-theme-options">
            {THEMES.map(t => (
              <label
                key={t.value}
                className={`settings-theme-option ${theme === t.value ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={t.value}
                  checked={theme === t.value}
                  onChange={() => setTheme(t.value)}
                />
                <span className="settings-theme-label">{t.label}</span>
                <span className="settings-theme-desc">{t.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Save button */}
        <div className="settings-footer">
          <button className="settings-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save & Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
