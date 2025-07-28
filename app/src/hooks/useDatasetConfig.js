import { useState, useEffect } from 'react';
import baciConfig from '../config/datasources/baci.json';
import prodcomConfig from '../config/datasources/prodcom.json';
import globalConfig from '../config/datasources/config.json';

const useDatasetConfig = (datasetId) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        let datasetConfig;

        switch (datasetId) {
          case 'baci':
            datasetConfig = baciConfig;
            break;
          case 'prodcom':
            datasetConfig = prodcomConfig;
            break;
          // Add more datasets here as they're created
          default:
            throw new Error(`Unknown dataset: ${datasetId}`);
        }

        // Merge with global config
        const mergedConfig = {
          ...datasetConfig,
          apiBase: globalConfig.apiBase
        };

        setConfig(mergedConfig);
        setError(null);
      } catch (err) {
        setError(err.message);
        setConfig(null);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [datasetId]);

  return { config, loading, error };
};

export default useDatasetConfig;
