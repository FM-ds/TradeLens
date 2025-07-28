const DatasetSelector = ({ 
  availableDatasets,
  selectedDataset,
  onDatasetChange
}) => {
  const datasetInfo = {
    baci: {
      id: 'baci',
      name: 'BACI',
      title: 'Trade flows',
      yearRange: '2017-2022',
      description: 'Annual trade flows for HS6 products.',
      speed: 'Fast',
      speedIcon: '⚡',
      borderColor: 'blue',
    },
    prodcom: {
      id: 'prodcom',
      name: 'PRODCOM',
      title: 'Manufacturers\' Sales',
      yearRange: '2014-2024',
      description: 'Annual sales for UK manufacturers by CN8 product.',
      speed: 'Manufacturing',
      speedIcon: '🏭',
      borderColor: 'purple',
    }
    // Add more dataset info here as new datasets are added
  };

  return (
    <div className="mb-8 flex gap-6 flex-wrap">
      {availableDatasets.map((datasetId) => {
        const info = datasetInfo[datasetId];
        if (!info) return null;

        return (
          <button
            key={datasetId}
            className={`rounded-lg border-2 border-gray-700 bg-gray-800 px-8 py-6 flex flex-col items-start min-w-[220px] shadow-lg transition-all ${
              selectedDataset === datasetId
                ? `border-${info.borderColor}-500 ring-2 ring-${info.borderColor}-500`
                : `hover:border-${info.borderColor}-400`
            }`}
            onClick={() => onDatasetChange(datasetId)}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base font-bold">{info.name}</span>
            </div>
            <div className="text-lg font-semibold mb-1">{info.title}</div>
            <div className="text-sm text-gray-300 mb-1">{info.yearRange}</div>
            <div className="text-sm text-gray-400 mb-4">{info.description}</div>
            <div className="flex items-center gap-2 mt-4 pt-2 border-t border-gray-700 w-full">
              <span className={`text-lg text-${info.borderColor}-400`}>{info.speedIcon}</span>
              <span className={`text-xs text-${info.borderColor}-400`}>{info.speed}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default DatasetSelector;
