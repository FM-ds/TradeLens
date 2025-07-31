import { useState, useEffect } from 'react';

const useModelInfo = () => {
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchModelInfo = async () => {
      try {
        const response = await fetch('https://api.tradelens.uk/api/model-info');
        if (!response.ok) {
          throw new Error('Failed to fetch model info');
        }
        const data = await response.json();
        setModelInfo(data);
        
        // Log model info to console for developers
        console.log('🧠 TradeLens Search Model Info:', data);
      } catch (err) {
        setError(err.message);
        console.warn('Could not fetch model info:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchModelInfo();
  }, []);

  return { modelInfo, loading, error };
};

export default useModelInfo;
