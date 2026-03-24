// Scan results table
import GlowCard from './GlowCard';

export default function ResultsTable({ results }) {
  if (!results || results.length === 0) return null;

  return (
    <>
    <h2 className="results-title">RESULTS</h2>
    <GlowCard className="results-card">
      <div className="results-header">
        <span className="results-count">
          {results.length} contract{results.length !== 1 ? 's' : ''} found
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <caption className="sr-only">Options scan results</caption>
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Strike</th>
              <th>Last</th>
              <th>Bid</th>
              <th>Ask</th>
              <th>OI</th>
              <th>Side</th>
              <th>IV</th>
              <th>ITM Price</th>
              <th className="gain-header">% Gain</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row, i) => (
              <tr key={i}>
                <td className="ticker">{row.ticker || row.Ticker}</td>
                <td className="mono">{row.strike || row.Strike}</td>
                <td className="mono">{row.last || row.Last}</td>
                <td className="mono">{row.bid || row.Bid}</td>
                <td className="mono">{row.ask || row.Ask}</td>
                <td className="mono">{row.openInterest || row.OI}</td>
                <td className={row.side === 'Call' || row.Side === 'Call' ? 'call' : 'put'}>
                  {row.side || row.Side}
                </td>
                <td className="mono">{row.iv || row.IV}</td>
                <td className="mono">{row.itmPrice || row['ITM Price']}</td>
                <td className="gain mono">{row.gain || row['% Gain']}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlowCard>
    </>
  );
}
