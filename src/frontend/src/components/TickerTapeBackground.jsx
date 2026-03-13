// Scrolling ticker tape background animation
const ROWS = [
  { tickers: 'AAPL 189.42 ▲ · TSLA 248.90 ▼ · NVDA 875.33 ▲ · MSFT 415.67 ▲ · AMZN 178.24 ▼ · META 502.18 ▲ · GOOG 155.89 ▼ · AMD 164.55 ▲ · SPY 585.23 ▲ · QQQ 498.17 ▼ · NFLX 628.40 ▲ · BA 182.33 ▼', dir: 'left' },
  { tickers: 'JPM 198.75 ▲ · V 278.60 ▲ · DIS 112.44 ▼ · PYPL 67.82 ▼ · CRM 272.50 ▲ · INTC 31.25 ▼ · IWM 221.05 ▲ · COIN 225.40 ▲ · PLTR 24.18 ▲ · SOFI 8.92 ▼ · RIVN 18.33 ▼ · SNAP 11.45 ▼', dir: 'right' },
  { tickers: 'XOM 107.88 ▲ · WMT 165.22 ▲ · BAC 35.18 ▼ · T 17.45 ▼ · GME 14.20 ▲ · AMC 4.85 ▼ · BABA 88.92 ▲ · NIO 7.33 ▼ · UBER 72.15 ▲ · SQ 78.44 ▲ · ROKU 68.90 ▼ · SHOP 72.18 ▲', dir: 'left' },
  { tickers: 'MU 88.65 ▲ · COST 575.20 ▲ · PFE 28.33 ▼ · MRNA 102.18 ▼ · LLY 782.40 ▲ · UNH 528.90 ▲ · HD 345.67 ▼ · CAT 278.44 ▲ · GS 382.15 ▲ · MS 92.30 ▼ · SBUX 98.72 ▲ · NKE 108.55 ▼', dir: 'right' },
  { tickers: 'ABNB 148.33 ▲ · DKNG 38.92 ▲ · HOOD 18.45 ▼ · LCID 3.88 ▼ · F 12.15 ▼ · GM 38.72 ▲ · PANW 302.18 ▲ · ZS 215.44 ▲ · CRWD 285.30 ▲ · NET 82.18 ▲ · DDOG 118.55 ▲ · SNOW 162.40 ▼', dir: 'left' },
  { tickers: 'MARA 22.15 ▲ · RIOT 12.88 ▲ · MSTR 1485.20 ▲ · SLV 22.40 ▼ · GLD 192.55 ▲ · USO 75.18 ▼ · TLT 92.33 ▼ · HYG 77.45 ▲ · VXX 18.72 ▼ · ARKK 48.90 ▼ · XLF 38.22 ▲ · XLE 88.15 ▲', dir: 'right' },
  { tickers: 'SMCI 745.20 ▲ · ARM 135.88 ▲ · AVGO 1282.40 ▲ · TSM 142.15 ▲ · QCOM 168.33 ▼ · MCD 292.18 ▲ · KO 60.45 ▲ · PEP 172.90 ▼ · JNJ 158.72 ▼ · ABBV 175.55 ▲ · TMO 572.18 ▲ · DHR 248.33 ▼', dir: 'left' },
  { tickers: 'ORCL 125.40 ▲ · ADBE 558.72 ▲ · NOW 735.18 ▲ · INTU 628.45 ▼ · ISRG 385.22 ▲ · REGN 898.15 ▼ · VRTX 418.33 ▲ · LRCX 742.88 ▲ · KLAC 618.45 ▼ · AMAT 172.30 ▲ · MRVL 72.18 ▲ · ON 75.55 ▼', dir: 'right' },
  { tickers: 'DELL 122.88 ▲ · HPQ 28.45 ▼ · IBM 188.72 ▲ · CSCO 52.18 ▲ · TXN 172.33 ▼ · ADI 198.55 ▲ · NXPI 228.40 ▲ · FTNT 62.18 ▲ · OKTA 92.72 ▼ · TWLO 62.45 ▼ · MDB 388.18 ▲ · TEAM 218.33 ▲', dir: 'left' },
  { tickers: 'W 52.18 ▼ · ETSY 72.45 ▼ · PINS 32.88 ▲ · TTD 82.33 ▲ · RBLX 42.72 ▲ · U 28.18 ▼ · PATH 22.45 ▲ · AI 28.88 ▲ · IONQ 12.33 ▲ · RGTI 3.55 ▲ · QUBT 8.18 ▲ · CIFR 5.72 ▼', dir: 'right' },
  { tickers: 'SOXX 228.18 ▲ · SMH 198.45 ▲ · XLK 192.72 ▲ · XBI 88.33 ▼ · KWEB 28.18 ▼ · EEM 42.55 ▼ · FXI 28.40 ▼ · IBIT 42.72 ▲ · BITO 22.18 ▲ · SQQQ 8.88 ▼ · TQQQ 62.33 ▲ · SPXS 12.18 ▼', dir: 'left' },
  { tickers: 'CHWY 18.92 ▼ · DASH 128.45 ▲ · LYFT 14.72 ▲ · ZM 68.33 ▼ · DOCU 58.18 ▼ · BILL 62.55 ▲ · HUBS 588.40 ▲ · WDAY 252.72 ▲ · VEEV 192.18 ▲ · CDNS 282.88 ▲ · SNPS 518.33 ▲ · ANSS 335.18 ▲', dir: 'right' },
  { tickers: 'ENPH 128.72 ▼ · SEDG 72.18 ▼ · FSLR 172.45 ▲ · NEE 72.33 ▲ · CEG 178.88 ▲ · VST 52.18 ▲ · OXY 58.72 ▼ · DVN 45.45 ▼ · EOG 118.18 ▲ · COP 112.88 ▼ · SLB 48.33 ▼ · HAL 35.18 ▼', dir: 'left' },
  { tickers: 'WFC 48.55 ▲ · C 52.18 ▲ · SCHW 72.45 ▲ · BLK 788.33 ▲ · AXP 218.72 ▲ · COF 142.18 ▲ · DFS 128.55 ▲ · ALLY 32.40 ▼ · SYF 42.72 ▲ · FITB 35.18 ▼ · KEY 14.88 ▼ · RF 18.33 ▼', dir: 'right' },
  { tickers: 'LMT 452.88 ▲ · RTX 98.45 ▲ · NOC 472.72 ▲ · GD 278.33 ▲ · SPCE 1.88 ▼ · RKLB 8.18 ▲ · LUNR 12.55 ▲ · JOBY 6.40 ▲ · ACHR 5.72 ▲ · LILM 2.18 ▼ · EVTL 1.88 ▼ · BLDE 3.33 ▼', dir: 'left' },
  { tickers: 'SPOT 285.45 ▲ · SE 48.72 ▲ · GRAB 3.88 ▲ · NU 10.18 ▲ · MELI 1628.55 ▲ · GLOB 198.40 ▲ · DLOCL 12.72 ▼ · STNE 12.18 ▼ · PAGS 10.88 ▼ · XP 22.33 ▼ · BIDU 108.18 ▼ · PDD 128.55 ▼', dir: 'right' },
];

export default function TickerTapeBackground() {
  return (
    <div className="ticker-bg">
      {ROWS.map((row, i) => {
        // split into individual spans, duplicate for seamless loop
        const spans = row.tickers.split(' · ');
        const doubled = [...spans, ...spans];
        return (
          <div
            key={i}
            className={`ticker-bg-row scroll-${row.dir}`}
          >
            {doubled.map((t, j) => (
              <span key={j}>{t}</span>
            ))}
          </div>
        );
      })}
    </div>
  );
}
