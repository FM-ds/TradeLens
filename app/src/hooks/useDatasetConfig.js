import { useState, useEffect } from 'react';
import baciConfig from '../config/datasources/baci.json';
import prodcomConfig from '../config/datasources/prodcom.json';
import globalConfig from '../config/datasources/config.json';

const useDatasetConfig = (datasetId) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

    useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const loadConfig = async () => {
      setLoading(true);
      setError(null);
      setConfig(null);

      try {
        let datasetConfig;

        switch (datasetId) {
          case 'baci':
            datasetConfig = baciConfig;
            break;
          case 'prodcom':
            datasetConfig = prodcomConfig;
            break;
          default:
            throw new Error(`Unknown dataset: ${datasetId}`);
        }

        // Copy the bundled configuration rather than modifying its imports.
        let mergedConfig = {
          ...datasetConfig,
          apiBase: globalConfig.apiBase
        };

        if (datasetId === 'baci') {
          const response = await fetch(
            `${mergedConfig.apiBase}${mergedConfig.endpoints.metadata}`,
            { signal: controller.signal }
          );

          if (!response.ok) {
            throw new Error(
              `Failed to load BACI metadata (HTTP ${response.status})`
            );
          }

          const metadata = await response.json();

          // Reject invalid metadata instead of using stale, bundled year bounds.
          if (
            metadata === null ||
            typeof metadata !== 'object' ||
            !Number.isInteger(metadata.year_min) ||
            !Number.isInteger(metadata.year_max) ||
            metadata.year_min > metadata.year_max
          ) {
            throw new Error('BACI metadata contains an invalid year range');
          }

          mergedConfig = {
            ...mergedConfig,
            query: {
              ...mergedConfig.query,
              yearRange: {
                min: metadata.year_min,
                max: metadata.year_max
              },
              defaultStartYear: String(metadata.year_min),
              defaultEndYear: String(metadata.year_max)
            }
          };
        }

        if (!cancelled) {
          setConfig(mergedConfig);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load dataset configuration'
          );
          setConfig(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadConfig();

    // Prevent an old request from updating state after unmount or a dataset switch.
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [datasetId]);

  return { config, loading, error };
};

export default useDatasetConfig;
