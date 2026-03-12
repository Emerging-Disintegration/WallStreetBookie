// Hook that waits for the pywebview bridge, then returns the api object

import { useState, useEffect } from 'react';

export function useApi() {
  const [api, setApi] = useState(window.pywebview?.api || null);

  useEffect(() => {
    if (window.pywebview?.api) {
      setApi(window.pywebview.api);
      return;
    }

    const handleReady = () => setApi(window.pywebview.api);
    window.addEventListener('pywebviewready', handleReady);
    return () => window.removeEventListener('pywebviewready', handleReady);
  }, []);

  return api;
}
