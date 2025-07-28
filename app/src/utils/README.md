# CSV Export Utility

This utility provides a universal CSV export system that can handle different dataset types with their unique data structures.

## Overview

The CSV export system is designed to be extensible and handle various data formats from different APIs or datasets. Currently supports:

- **BACI**: International trade data with fields like product_code, product, partner, trade_flow, etc.
- **PRODCOM**: EU manufacturing data with fields like code, description, type, measure, etc.

## Usage

### Basic Usage

```javascript
import { downloadCSV } from '../utils/csvExport';

// Download BACI data
downloadCSV(baciData, 'baci');

// Download PRODCOM data  
downloadCSV(prodcomData, 'prodcom');

// Download with custom filename
downloadCSV(data, 'baci', 'my-custom-export');
```

### Adding New Dataset Types

To add support for a new dataset type, use the `addDatasetConfig` function:

```javascript
import { addDatasetConfig } from '../utils/csvExport';

addDatasetConfig('newDataset', {
  headers: ['ID', 'Name', 'Value', 'Date'],
  fields: ['id', 'name', 'value', 'date'],
  filename: 'new-dataset-export'
});
```

### Dataset Configuration Structure

Each dataset configuration must include:

- `headers`: Array of column headers for the CSV file
- `fields`: Array of field names from the data objects (must match headers order)
- `filename`: Base filename for downloaded files (timestamp will be appended)

## Features

- **Automatic CSV Escaping**: Handles commas, quotes, and newlines in data
- **UTF-8 Support**: Proper encoding for international characters
- **Null/Undefined Handling**: Safely handles missing data
- **Extensible**: Easy to add new dataset types
- **Type Safety**: Validates field existence and types

## Implementation Details

### Data Field Mapping

**BACI Dataset:**
- Product Code → `product_code`
- Product Name → `product`
- Year → `year`
- Partner → `partner`
- Trade Flow → `trade_flow`
- Value (USD) → `value`
- Quantity → `quantity`
- Unit → `unit`

**PRODCOM Dataset:**
- Code → `code`
- Description → `description`
- Type → `type`
- Year → `year`
- Measure → `measure`
- Value → `value`
- Unit → `unit`
- Flag → `flag`

### CSV Formatting Rules

1. **Text Escaping**: Fields containing commas, quotes, or newlines are wrapped in double quotes
2. **Quote Escaping**: Internal double quotes are escaped as double-double quotes (`""`)
3. **Null Handling**: Null or undefined values become empty strings
4. **Encoding**: Files use UTF-8 encoding with BOM for Excel compatibility

## Example Output

**BACI CSV:**
```csv
Product Code,Product Name,Year,Partner,Trade Flow,Value (USD),Quantity,Unit
950300,"Toys, tricycles, scooters, pedal cars",2022,China,Imports,1500000,5000,kg
```

**PRODCOM CSV:**
```csv
Code,Description,Type,Year,Measure,Value,Unit,Flag
16211529,"Bread, fresh",Product,2022,Value,25000,£ million,
```

## Error Handling

The utility includes built-in error handling:
- Warns when attempting to export empty data
- Falls back to BACI configuration for unknown dataset types
- Safely handles missing fields in data objects

## Browser Compatibility

Uses modern browser APIs:
- `Blob()` for file creation
- `URL.createObjectURL()` for download links
- Automatic cleanup with `URL.revokeObjectURL()`

Compatible with all modern browsers (IE11+ with polyfills).
