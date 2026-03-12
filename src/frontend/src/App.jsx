// Root component — switches between Home and SearchResults views

import { useState } from 'react';
import { useApi } from './hooks/useApi';
import Home from './components/Home';
import SearchResults from './components/SearchResults';

function App() {
  const api = useApi();
  const [view, setView] = useState('home');
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async ({ ticker, expiration, desiredProfit, optionSide }) => {
    if (!api) return;

    setSearchLoading(true);
    setError(null);

    const result = await api.search_options(ticker, expiration, desiredProfit, optionSide);

    if (result.success) {
      setResults(result.data);
      setView('results');
    } else {
      setError(result.error);
    }

    setSearchLoading(false);
  };

  const handleBack = () => {
    setView('home');
    setResults([]);
    setError(null);
  };

  if (!api) {
    return <div className="loading">Loading WallStreetBookie...</div>;
  }

  return (
    <>
      {error && <div className="error-message">{error}</div>}

      {view === 'home' ? (
        <Home api={api} onSearch={handleSearch} searchLoading={searchLoading} />
      ) : (
        <SearchResults results={results} onBack={handleBack} />
      )}
    </>
  );
}

export default App;
