// Options contracts results table

const numericColumns = new Set([
  'Strike', 'Last Price', 'Bid', 'Ask', 'Change',
  'Open Interest', 'Implied Volatility', 'ITM Price', 'Percent Gain',
]);

export default function SearchResults({ results, onBack }) {
  const columns = [
    'Ticker',
    'Strike',
    'Last Price',
    'Bid',
    'Ask',
    'Change',
    'Open Interest',
    'Side',
    'Implied Volatility',
    'ITM Price',
    'Percent Gain',
  ];

  return (
    <div className="results-container">
      <h2 className="results-title">Potential Contracts</h2>
      <hr className="results-divider" />

      {results.length === 0 ? (
        <div className="loading">
          No contracts found matching your criteria.
        </div>
      ) : (
        <table className="results-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col} className={numericColumns.has(col) ? 'mono' : ''}>
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button className="home-fab" onClick={onBack} title="Back to Home">
        ⌂
      </button>
    </div>
  );
}
