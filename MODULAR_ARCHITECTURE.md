# Modular Search Interface Architecture

## Overview

The TradeLens search interface has been restructured to support multiple datasets in a modular way. This architecture allows for easy addition of new datasets without duplicating code.

## Architecture Components

### 1. Configuration Layer
- **`useDatasetConfig` hook** - Loads dataset-specific configuration from JSON files
- **`config/datasources/`** - Contains configuration files for each dataset
  - `baci.json` - BACI dataset configuration
  - `config.json` - Global configuration (API base URL, etc.)

### 2. API Layer
- **`useDatasetApi` hook** - Provides dataset-agnostic API functions
  - Product search
  - Country search
  - Trade query execution
  - Country code mapping

### 3. Component Layer
- **`BaseSearchInterface`** - Generic search UI component that works with any dataset
- **`BaciSearchInterface`** - BACI-specific wrapper with dataset info
- **`DatasetSearchInterface`** - Router component that renders the appropriate dataset interface
- **`DatasetSelector`** - UI for selecting between available datasets

### 4. Query Management
- **`useTradeQuery` hook** - Handles trade data fetching and pagination for any dataset

## File Structure

```
app/src/
├── hooks/
│   ├── useDatasetConfig.js     # Configuration loader
│   ├── useDatasetApi.js        # API abstraction
│   └── useTradeQuery.js        # Trade query management
├── components/
│   ├── BaseSearchInterface.jsx # Generic search UI
│   ├── BaciSearchInterface.jsx # BACI-specific implementation
│   ├── DatasetSearchInterface.jsx # Dataset router
│   ├── DatasetSelector.jsx     # Dataset selector UI
│   └── TradeDataPlatform.jsx   # Main platform (simplified)
└── config/datasources/
    ├── baci.json              # BACI configuration
    └── config.json            # Global configuration
```

## Adding a New Dataset

To add a new dataset (e.g., "comtrade"), follow these steps:

### 1. Create Dataset Configuration
Create `config/datasources/comtrade.json`:
```json
{
  "id": "comtrade",
  "name": "UN Comtrade",
  "description": "UN International Trade Statistics Database",
  "endpoints": {
    "products": "/api/comtrade/products/",
    "countries": "/api/comtrade/countries/",
    "tradeQuery": "/api/comtrade/trade-query/"
  },
  "product": {
    "searchParam": "q",
    "codeField": "commodity_code",
    "nameField": "commodity_description",
    "limitParam": "max",
    "defaultLimit": 10
  },
  "country": {
    "searchParam": "q",
    "codeField": "partner_code",
    "nameField": "partner_desc",
    "limitParam": "max",
    "defaultLimit": 15
  },
  "query": {
    "tradeTypeOptions": ["Import", "Export", "Both"],
    "defaultTradeType": "Import",
    "defaultStartYear": "2019",
    "defaultEndYear": "2023",
    "params": {
      "trade_type": "flow",
      "product_codes": "commodity_codes",
      "from_country": "reporter",
      "to_country": "partner",
      "year_from": "start_year",
      "year_to": "end_year",
      "page": "page",
      "page_size": "limit"
    }
  },
  "ui": {
    "showEverywhereOption": false,
    "showWorldOption": true,
    "productPillFormat": "{code}: {name}",
    "productNameTruncate": 15
  }
}
```

### 2. Update Configuration Hook
Add the new dataset to `useDatasetConfig.js`:
```javascript
switch (datasetId) {
  case 'baci':
    datasetConfig = baciConfig;
    break;
  case 'comtrade':
    datasetConfig = comtradeConfig;
    break;
  // ...
}
```

### 3. Create Dataset-Specific Component
Create `ComtradeSearchInterface.jsx`:
```jsx
import { useState, useEffect } from 'react';
import BaseSearchInterface from './BaseSearchInterface';
import useDatasetConfig from '../hooks/useDatasetConfig';
import useDatasetApi from '../hooks/useDatasetApi';

const ComtradeSearchInterface = ({ onQueryCreated, disabled = false, initialState = {} }) => {
  const { config, loading, error } = useDatasetConfig('comtrade');
  // ... implement similar to BaciSearchInterface
};
```

### 4. Update Dataset Router
Add the new dataset to `DatasetSearchInterface.jsx`:
```jsx
switch (selectedDataset) {
  case 'baci':
    return <BaciSearchInterface {...props} />;
  case 'comtrade':
    return <ComtradeSearchInterface {...props} />;
  // ...
}
```

### 5. Update Dataset Selector
Add dataset info to `DatasetSelector.jsx`:
```jsx
const datasetInfo = {
  baci: { /* ... */ },
  comtrade: {
    id: 'comtrade',
    name: 'UN Comtrade',
    title: 'Trade Statistics',
    yearRange: '2019-2023',
    description: 'UN International Trade Statistics',
    speed: 'Medium',
    speedIcon: '📊',
  }
};
```

### 6. Update Available Datasets
In `TradeDataPlatform.jsx`:
```jsx
const availableDatasets = ['baci', 'comtrade'];
```

## Benefits of This Architecture

1. **Separation of Concerns** - Configuration, API calls, and UI are cleanly separated
2. **Reusability** - Base components can be reused across datasets
3. **Maintainability** - Each dataset has its own configuration and interface
4. **Extensibility** - Easy to add new datasets without modifying existing code
5. **Type Safety** - Configuration-driven approach reduces magic strings
6. **Testing** - Each layer can be tested independently

## Configuration Schema

Each dataset configuration follows a standard schema:

- `id` - Unique identifier for the dataset
- `name` - Display name
- `description` - Brief description
- `endpoints` - API endpoint mappings
- `product`/`country` - Field mappings and search parameters
- `query` - Query parameter mappings and options
- `ui` - UI-specific settings and customizations

This modular approach makes it easy to support multiple trade data sources while maintaining a consistent user experience.
