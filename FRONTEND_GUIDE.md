# TradeLens Frontend Guide

**For developers with beginner JSX knowledge.** This guide explains how the `app/src/` directory is organised, what each file does, and how the pieces connect together. Use it to orient yourself before making changes.

---

## Contents

1. [The Big Picture](#1-the-big-picture)
2. [Entry Points](#2-entry-points)
3. [The Root Orchestrator: TradeDataPlatform](#3-the-root-orchestrator-tradedataplatformjsx)
4. [The Layout Layer](#4-the-layout-layer)
5. [The Search Layer](#5-the-search-layer)
6. [The Results Layer](#6-the-results-layer)
7. [Hooks — Where Data Lives](#7-hooks--where-data-lives)
8. [Utils — Shared Tools](#8-utils--shared-tools)
9. [Config — Dataset Definitions](#9-config--dataset-definitions)
10. [Quick-Reference Map](#10-quick-reference-map)

---

## 1. The Big Picture

TradeLens is a React single-page application (SPA). When it loads in the browser, React builds the whole UI in JavaScript — there are no separate HTML pages. All the source code that powers this UI lives in `app/src/`.

The `src/` directory is divided by *purpose*, not by dataset:

```
src/
├── main.jsx          ← starts the app
├── App.jsx           ← top-level wrapper
├── components/       ← everything the user sees
├── hooks/            ← data fetching and shared state logic
├── utils/            ← standalone helper functions
└── config/           ← dataset settings (API URLs, field names, chart options)
```

The core user journey looks like this:

1. User picks a **dataset** (BACI or PRODCOM)
2. User fills in a **search form** (products, countries, years)
3. App fetches **trade data** from the API
4. Data is shown in a **table** and **charts**

Each step corresponds to a different layer of components described in the sections below.

---

## 2. Entry Points

### `main.jsx`

This is where React starts. It finds the `<div id="root">` in `index.html` and mounts the entire application inside it.

```jsx
// main.jsx (simplified)
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(<App />)
```

You will rarely need to touch this file.

### `App.jsx`

A thin wrapper that simply renders the main platform component:

```jsx
// App.jsx
function App() {
  return <TradeDataPlatform />
}
```

This exists as a conventional entry point. Any app-wide providers (e.g., a future theme or auth context) would be added here.

---

## 3. The Root Orchestrator: `TradeDataPlatform.jsx`

**File:** `components/TradeDataPlatform.jsx`

This is the most important file in the frontend. It is the brain of the application — it owns almost all state and wires everything together.

### What state does it hold?

| State variable | What it tracks |
|---|---|
| `queries` | An array of all queries the user has built in this session |
| `activeQueryId` | Which query is currently selected and displayed |
| `selectedDataset` | `'baci'` or `'prodcom'` — which dataset tab is active |
| `sidebarCollapsed` | Whether the left sidebar is open or collapsed |
| `currentPage`, `rowsPerPage` | Pagination for the results table |

### How does it get data?

It uses three custom hooks (explained in [Section 7](#7-hooks--where-data-lives)):

```jsx
const { tradeData, tradeDataLoading, ... } = useTradeQuery(activeQuery, currentPage, rowsPerPage)
const { config } = useDatasetConfig(activeQuery?.dataset)
const api = useDatasetApi(config)
```

### What does it render?

```
<TradeDataPlatform>
  ├── <Sidebar />                 — left panel with saved queries
  └── main content area
        ├── <DatasetSelector />   — BACI / PRODCOM tabs
        ├── <DatasetSearchInterface />  — the search form
        └── (when a query is active):
              ├── <ResultsHeader />     — query title + CSV download
              ├── <TradeDataTable />    — paginated data table
              ├── <DataVisualization /> — line/bar/area charts
              └── <GeographicMapPanel /> — map (coming soon)
            (when no query is active):
              └── <EmptyState />        — "Create your first query" prompt
```

> **Key pattern:** `TradeDataPlatform` passes data *down* to children as **props**, and receives user actions *back up* via **callback functions** (e.g., `onQueryCreated`, `handleDeleteQuery`). This is the standard React data-flow pattern.

---

## 4. The Layout Layer

These components handle the chrome and navigation of the app — they don't know about trade data specifically.

### `Sidebar.jsx`

The collapsible left panel. It receives the full list of saved queries and renders them as a menu. When the user clicks a query, it calls `handleLoadQuery` to tell `TradeDataPlatform` to switch to it.

**Key props:**

| Prop | Type | Purpose |
|---|---|---|
| `queries` | array | List of all saved queries to display |
| `activeQueryId` | string | Highlights the currently selected query |
| `sidebarCollapsed` | boolean | Controls whether the sidebar is wide or icon-only |
| `handleNewQuery` | function | Called when user clicks "New Query" |
| `handleLoadQuery` | function | Called when user selects a query from the list |
| `handleDeleteQuery` | function | Called when user deletes a query |
| `getQueryDisplayName` | function | Formats a query object into a readable label |

### `DatasetSelector.jsx`

Renders the two dataset toggle buttons at the top of the page (BACI and PRODCOM). When the user clicks one, it calls `onDatasetChange`, which updates `selectedDataset` in `TradeDataPlatform`.

### `EmptyState.jsx`

A simple placeholder shown in the main area before any query has been run. No props — it just renders a search icon and a prompt message.

---

## 5. The Search Layer

The search layer is built as a three-level hierarchy. This avoids repeating code for the two datasets that share a similar search form.

```
DatasetSearchInterface      ← decides which form to show
    ├── BaciSearchInterface     ← BACI-specific logic and data
    └── ProdcomSearchInterface  ← PRODCOM-specific logic and data
            ↓
        BaseSearchInterface     ← shared form UI (used by both)
```

### `DatasetSearchInterface.jsx`

A pure **router**. It checks `selectedDataset` and renders the appropriate form:

```jsx
if (selectedDataset === 'baci')    return <BaciSearchInterface ... />
if (selectedDataset === 'prodcom') return <ProdcomSearchInterface ... />
```

**Key props:** `selectedDataset`, `onQueryCreated`, `initialState`

### `BaciSearchInterface.jsx`

Handles everything specific to a BACI query:

- Searches for **products** (HS commodity codes) and **countries** using live API calls
- Manages state for: selected products, from-countries, to-countries, trade type (imports/exports/all), year range
- On submit, assembles a query object and calls `onQueryCreated`

It uses `useDatasetConfig` and `useDatasetApi` hooks to communicate with the API.

### `ProdcomSearchInterface.jsx`

The PRODCOM equivalent. Key differences from BACI:

- **No country selection** — PRODCOM is UK-only data
- Has a **measure type** selector (Value / Volume / Average Price) instead of trade direction
- Has a **product type filter** (Division / Industry / Product), corresponding to the CN8 classification hierarchy

### `BaseSearchInterface.jsx`

The shared **form template** used by both search interfaces. It renders:

- Product search input with autocomplete suggestions (displayed as removable pills)
- From/To country search inputs (BACI only)
- Trade type buttons
- Year range pickers
- "Execute Query" button

It receives all its state and handlers as props — it holds no logic of its own. Think of it as a purely visual form.

---

## 6. The Results Layer

Once a query has been executed, these components display the data.

### `ResultsHeader.jsx`

A slim header bar above the results showing:

- The human-readable query description (e.g. "Exports of 950300 from UK to China")
- The selected year range
- A **Download CSV** button (disabled until data has loaded)

**Key props:** `query`, `getQueryDisplayName`, `downloadCSV`, `tradeData`

### `TradeDataTable.jsx`

A paginated table of raw trade data. It adapts its columns based on which dataset is active:

- **BACI:** Product code, product name, year, partner, trade flow, value, quantity
- **PRODCOM:** Code, description, type, year, measure, value, unit, flag

Below the table are standard pagination controls (Previous / page numbers / Next).

**Key props:**

| Prop | Purpose |
|---|---|
| `tradeData` | Array of row objects to display |
| `tradeDataLoading` | Shows a loading spinner when `true` |
| `dataset` | `'baci'` or `'prodcom'` — controls column layout |
| `currentPage`, `totalPages`, `goToPage` | Pagination |
| `startIndex`, `endIndex`, `tradeDataTotal` | "Showing X–Y of Z records" label |

### `DataVisualization.jsx`

Renders interactive charts of the trade data using [Vega-Lite](https://vega.github.io/vega-lite/) (via `react-vega`).

The user can control:

- **Chart type** — Line, Bar, or Area
- **Metric (Y-axis)** — e.g. Trade Value (USD) or Trade Quantity
- **Group by (series)** — e.g. by Product, by Exporter Country, by Importer Country

> **How charts fetch data:** Rather than re-using the already-loaded table data, `DataVisualization` fetches data directly from the API using the `apiUrl` passed down from `TradeDataPlatform`. This allows charts to pull a larger dataset (up to 1,000 records) than the paginated table shows. The chart spec is built by `createChartSpecWithAPI()` in `config/chartConfig.js`.

**Key props:** `data`, `dataset`, `query`, `apiUrl`

### `GeographicMapPanel.jsx`

A placeholder component for a future geographic trade flow map. Currently renders a "Coming Soon" message. No props.

---

## 7. Hooks — Where Data Lives

Hooks are JavaScript functions whose names start with `use`. They encapsulate logic that components would otherwise repeat. Hooks live in `src/hooks/`.

> **Rule of thumb:** If a component needs to *fetch data* or *share state across re-renders*, that logic belongs in a hook, not in the component itself.

### `useDatasetConfig.js`

**What it does:** Loads the JSON configuration file for a given dataset (`baci` or `prodcom`) and merges it with the global API base URL from `config/datasources/config.json`.

**Returns:** `{ config, loading, error }`

The `config` object tells the rest of the app things like: what API endpoints to call, what field name holds the product code, what the valid year range is.

**Used by:** `BaciSearchInterface`, `ProdcomSearchInterface`, `TradeDataPlatform`

### `useDatasetApi.js`

**What it does:** Provides a suite of API functions for a given dataset config. Initialises by loading all available countries into a lookup map.

**Returns:**

| Returned value | Purpose |
|---|---|
| `searchProducts(term, typeFilter?)` | Fetch autocomplete suggestions for the product search input |
| `searchCountries(term)` | Fetch autocomplete suggestions for the country search input |
| `executeTradeQuery(params, page, pageSize)` | Run a BACI query and return data + total count |
| `executeProdcomQuery(params, page, pageSize)` | Run a PRODCOM query and return data + total count |
| `getCountryCodeByName(name)` | Look up a country code from its display name |
| `productSuggestions` | Current list of product autocomplete results |
| `countrySuggestions` | Current list of country autocomplete results |

**Used by:** `BaciSearchInterface`, `ProdcomSearchInterface`, `useTradeQuery`

### `useTradeQuery.js`

**What it does:** Watches the `activeQuery` object. Whenever it changes, this hook automatically fires the appropriate API call (`executeTradeQuery` or `executeProdcomQuery`) and returns the results.

**Returns:** `{ tradeData, tradeDataTotal, tradeDataTotalPages, tradeDataLoading, apiUrl }`

The `apiUrl` it returns is the raw API endpoint URL (without pagination parameters). This is passed to `DataVisualization` so charts can fetch their own data slice.

**Used by:** `TradeDataPlatform`

### `useModelInfo.js`

**What it does:** Fetches metadata about the backend ML model from `http://127.0.0.1:8000/api/model-info`. Currently only logs to the console.

**Used by:** Not yet wired into any component. Reserved for future LLM-assisted query features.

---

## 8. Utils — Shared Tools

**Directory:** `src/utils/`

### `csvExport.js`

Provides two exported functions for downloading trade data as a CSV file:

| Function | Purpose |
|---|---|
| `generateCSVContent(data, dataset)` | Converts an array of row objects into a CSV-formatted string |
| `downloadCSV(data, dataset, customFilename?)` | Triggers a browser file download |

Column headers are auto-generated from the data's field names (e.g. `product_code` → `Product Code`). The file is named with a timestamp, e.g. `baci-data-1699123456.csv`.

See [`utils/README.md`](./utils/README.md) for full usage details.

---

## 9. Config — Dataset Definitions

**Directory:** `src/config/`

This directory contains static configuration files that describe each dataset. Separating configuration from code means you can change API endpoints or field names without touching component logic.

### `datasources/config.json` — Global settings

```json
{
  "apiBase": "https://api.tradelens.uk"
}
```

The single source of truth for the API base URL.

### `datasources/baci.json` — BACI dataset config

Defines the API endpoints, query parameter names, product/country field names, and the valid year range (2017–2022) for the BACI international trade dataset.

### `datasources/prodcom.json` — PRODCOM dataset config

The equivalent for the PRODCOM manufacturing dataset. Note: no `countries` endpoint, because PRODCOM is UK-only. Valid year range is 2014–2024.

### `chartConfig.js` — Chart definitions

Exports configuration and helper functions used by `DataVisualization`:

| Export | Purpose |
|---|---|
| `CHART_TYPES` | Constants: `LINE`, `BAR`, `AREA`, `SCATTER` |
| `CHART_CONFIGS` | Per-dataset chart settings (metrics, group-by options, colour palettes) |
| `createChartSpecWithAPI(...)` | Builds a Vega-Lite spec that fetches data directly from an API URL |
| `formatValue(value, format)` | Formats a number as currency or a plain number for display |

---

## 10. Quick-Reference Map

Use this table to find the right file when you want to change something specific.

| I want to change... | Go to... |
|---|---|
| The overall page layout (sidebar + main area split) | `components/TradeDataPlatform.jsx` |
| The sidebar's appearance or query list | `components/Sidebar.jsx` |
| The BACI / PRODCOM toggle buttons | `components/DatasetSelector.jsx` |
| The BACI search form fields | `components/BaciSearchInterface.jsx` |
| The PRODCOM search form fields | `components/ProdcomSearchInterface.jsx` |
| The shared search form layout (inputs, pills, buttons) | `components/BaseSearchInterface.jsx` |
| The results table columns or pagination | `components/TradeDataTable.jsx` |
| The chart type options or Y-axis metrics | `components/DataVisualization.jsx` and `config/chartConfig.js` |
| The "no query yet" placeholder screen | `components/EmptyState.jsx` |
| The query title and CSV download button | `components/ResultsHeader.jsx` |
| How products/countries are searched via the API | `hooks/useDatasetApi.js` |
| How a submitted query triggers a data fetch | `hooks/useTradeQuery.js` |
| What API URL or field names a dataset uses | `config/datasources/baci.json` or `config/datasources/prodcom.json` |
| The global API base URL | `config/datasources/config.json` |
| How CSV files are generated and downloaded | `utils/csvExport.js` |
| Chart colours, Vega-Lite specs, or chart metrics | `config/chartConfig.js` |
