# WallStreetBookie

![Screenshot: WallStreetBookie Home Page](app_screenshots/demo.mp4)

**WallStreetBookie** is a free desktop options scanner designed for day/swing traders to find out-of-the-money (OTM) contracts hitting specific profit targets. The application features a editable market ticker strip and real-time VIX context, providing traders with an immediate sense of market sentiment and volatility as they navigate the UI. Built with a  Python backend and a  React frontend, it provides the tools to identify and analyze high-potential trades.

## 🚀 Key Features

### 🔍 Profit Calculator (Options Scanner)

The core of WallStreetBookie. Find contracts that match your specific risk/reward profile.

- **Smart Filtering**: Input a ticker, expiration date, and a target profit percentage (Target Gain %). The scanner filters through contracts to find only those projected to hit your target.
- **Call/Put Flexibility**: Toggle between scanning for Calls, Puts, or both simultaneously.
- **Hottest Stocks Mode**: One-click scan for the top 3 most active options chains in the market, saving you the time of manual ticker entry.

#### Set Your Parameters

![SCREENSHOT: PROFIT_CALCULATOR](app_screenshots/profit_calulator.jpg)

#### Look Through Your Options (*Pun Intended*)

![Screenshot: Results Table](app_screenshots/results.jpg)

---

### 🤖 AI Risk Analysis

Powered by Google Gemini, WallStreetBookie provides AI-driven pre-trade risk assessment.

- **Three-Point Audit**: Evaluates every trade against Liquidity, Price Target Feasibility, and IV Crush Risk

- **Risk Scoring**: Classifies each trade as Low, Moderate, or Extreme risk

- **Real-Time Analysis**: Click "Risk Analysis" on any contract to get an instant AI-powered review

- **API Integration**: Connect your Gemini API key via Settings to enable this feature (free key available at aistudio.google.com)

![VIDEO: AI Analyze](app_screenshots/ai-analyze.mp4)

---

### 🔥 Most Active Options Chains

Identify where the "smart money" and retail volume are flowing.

- **Ranked Volume**: A dedicated view of the highest-volume options chains across the market.
- **Sentiment Analysis**: Automatically calculates Put/Call ratios with a 0.7 "Bullish" threshold to highlight market sentiment at a glance.

![SCREENSHOT: MOST_ACTIVE_TABLE](app_screenshots/most_active_table.jpg)

---

### ⭐ Unified Watchlist & Multi-Timeframe Performance

WallStreetBookie offers a unique watchlist that provides a "bird's-eye view" of your entire group of favorite stocks across multiple horizons simultaneously.

- **Multi-Horizon Performance**: Toggle performance across six critical timeframes: **1D, 5D, 1M, 6M, YTD, and 1Y**. Instantly spot relative strength and emerging trends across your custom basket without checking individual charts.
- **Dynamic Pricing**: Real-time stock price tracking integrated directly into the list view with automatic updates.
- **Smart Sorting**: Sort your watchlist by performance change within any timeframe—instantly identify top and bottom performers.
- **Tag Organization**: Organize and filter with custom tags. Add multiple labels to any ticker (e.g., "Growth", "Tech", "Swing-Trade") and filter by tag to focus on specific groups.
- **Added-Date Tracking**: See when each ticker was added to your watchlist for historical context.
- **One-Click Curation**: Star any ticker from search results or "Most Active" tables to instantly add or remove from your list.
- **Persistent Local Storage**: Your watchlist is stored locally in `~/.wallstreetbookie/watchlist.json` with atomic writes, ensuring data integrity, privacy, and portability.

![SCREENSHOT: WATCHLIST](app_screenshots/watchlist.jpg)

---

### 📉 P/L Charting & Decay Simulation

Visualize your potential outcomes with a sophisticated charting engine.

- **Black-Scholes Modeling**: Professional-grade P/L curves calculated using real-time Greek data.
- **Live DTE Slider**: Simulate time decay (Theta) by dragging the DTE slider. Watch the curve flatten or expand in real-time to see how time affects your trade.
- **Metrics Bar**: A persistent HUD above the chart showing Stock Price, P/L, and Contract Value at any point on the curve. Updates instantly as you hover.
- **Reference Overlays**: Clear indicators for Strike Price, Current Underlying Price, and the critical Breakeven line.

![SCREENSHOT: PNL_CHART](app_screenshots/pnl_chart.jpg)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Desktop Shell** | [pywebview](https://pywebview.flowrl.com/) (Python 3.12) |
| **Frontend** | React 19 + Vite + Recharts |
| **Backend** | Python 3.12 with JS Bridge (`api.py`) |
| **Data Layer** | Custom wrappers for `yfinance` and `beautifulsoup4` |
| **Styling** | Vanilla CSS (Glassmorphism / Cyberpunk aesthetic) |

---

## ⚙️ Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- Poetry (`pip install poetry`)

### Installation

1. **Python Dependencies**:

   ```bash
   cd src
   poetry install
   ```

2. **Frontend Dependencies**:

   ```bash
   cd src/frontend
   npm install
   ```

### Running the Application

- **Development Mode**: Spawns a Vite dev server and opens the pywebview window with hot-reloading.

  ```bash
  cd src
  WALLSTBOOKIE_DEV=1 python -m backend.main
  ```

- **Production Mode**: Build the frontend first, then launch the standalone desktop app.

  ```bash
  cd src/frontend
  npm run build
  cd ..
  python -m backend.main
  ```

---

## 📜 License

GNU AFFERO GENERAL PUBLIC LICENSE

- Version 3, 19 November 2007
