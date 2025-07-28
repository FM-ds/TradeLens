import BaciSearchInterface from './BaciSearchInterface';
import ProdcomSearchInterface from './ProdcomSearchInterface';
// Import other dataset search interfaces here as they're created

const DatasetSearchInterface = ({ 
  selectedDataset,
  onQueryCreated,
  disabled = false,
  initialState = {}
}) => {
  switch (selectedDataset) {
    case 'baci':
      return (
        <BaciSearchInterface
          onQueryCreated={onQueryCreated}
          disabled={disabled}
          initialState={initialState}
        />
      );
    case 'prodcom':
      return (
        <ProdcomSearchInterface
          onQueryCreated={onQueryCreated}
          disabled={disabled}
          initialState={initialState}
        />
      );
    // Add other dataset cases here
    default:
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-8">
          <div className="text-center text-gray-400">
            Dataset "{selectedDataset}" not supported yet.
          </div>
        </div>
      );
  }
};

export default DatasetSearchInterface;
