// Chart configuration for different datasets and visualization types

// Define available chart types and their requirements
export const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  AREA: 'area',
  SCATTER: 'scatter'
};

// Chart configurations for different datasets
export const CHART_CONFIGS = {
  baci: {
    availableMetrics: [
      { value: 'value', label: 'Trade Value (USD)', format: 'currency' },
      { value: 'quantity', label: 'Trade Quantity', format: 'number' },
      { value: 'unit_value', label: 'Unit Value (USD/unit)', format: 'currency' }
    ],
    defaultMetric: 'value',
    dateField: 'year',
    groupByFields: [
      { value: 'product', label: 'Product', field: 'product' }, // API returns product codes in 'product' field
      { value: 'partner', label: 'Partner Country', field: 'partner' } // API returns country codes in 'partner' field
    ],
    defaultGroupBy: 'product',
    timeRange: { min: 2017, max: 2022 },
    colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
  },
  prodcom: {
    availableMetrics: [
      { value: 'value', label: 'Manufacturing Value', format: 'currency' },
      { value: 'volume', label: 'Volume', format: 'number' },
      { value: 'average_price', label: 'Average Price', format: 'currency' }
    ],
    defaultMetric: 'value',
    dateField: 'year',
    groupByFields: [
      { value: 'product', label: 'Product', field: 'description' },
      { value: 'type', label: 'Product Type', field: 'type' }
    ],
    defaultGroupBy: 'product',
    timeRange: { min: 2014, max: 2024 },
    colors: ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#14b8a6', '#f97316']
  }
};

// Base Vega-Lite specifications for different chart types
export const BASE_SPECS = {
  [CHART_TYPES.LINE]: {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "mark": {
      "type": "line",
      "point": true,
      "strokeWidth": 2
    },
    "encoding": {
      "x": {
        "field": "year",
        "type": "temporal",
        "axis": {
          "title": "Year",
          "titleColor": "#9ca3af",
          "labelColor": "#9ca3af",
          "grid": false,
          "tickColor": "#374151",
          "domainColor": "#374151"
        }
      },
      "y": {
        "field": "value",
        "type": "quantitative",
        "axis": {
          "titleColor": "#9ca3af",
          "labelColor": "#9ca3af",
          "grid": true,
          "gridColor": "#374151",
          "tickColor": "#374151",
          "domainColor": "#374151"
        }
      },
      "color": {
        "field": "group",
        "type": "nominal",
        "legend": {
          "titleColor": "#9ca3af",
          "labelColor": "#9ca3af",
          "orient": "bottom"
        }
      },
      "tooltip": [
        {"field": "year", "type": "temporal", "title": "Year"},
        {"field": "group", "type": "nominal", "title": "Series"},
        {"field": "value", "type": "quantitative", "title": "Value"}
      ]
    },
    "background": "#1f2937",
    "config": {
      "view": {
        "stroke": "transparent",
        "continuousWidth": 600,
        "continuousHeight": 300
      },
      "axis": {
        "domainColor": "#374151",
        "gridColor": "#374151",
        "tickColor": "#374151"
      }
    }
  },
  
  [CHART_TYPES.BAR]: {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "mark": {
      "type": "bar",
      "strokeWidth": 1,
      "stroke": "#374151"
    },
    "encoding": {
      "x": {
        "field": "year",
        "type": "temporal",
        "axis": {
          "title": "Year",
          "titleColor": "#9ca3af",
          "labelColor": "#9ca3af",
          "grid": false,
          "tickColor": "#374151",
          "domainColor": "#374151"
        }
      },
      "y": {
        "field": "value",
        "type": "quantitative",
        "axis": {
          "titleColor": "#9ca3af",
          "labelColor": "#9ca3af",
          "grid": true,
          "gridColor": "#374151",
          "tickColor": "#374151",
          "domainColor": "#374151"
        }
      },
      "color": {
        "field": "group",
        "type": "nominal",
        "legend": {
          "titleColor": "#9ca3af",
          "labelColor": "#9ca3af",
          "orient": "bottom"
        }
      },
      "tooltip": [
        {"field": "year", "type": "temporal", "title": "Year"},
        {"field": "group", "type": "nominal", "title": "Series"},
        {"field": "value", "type": "quantitative", "title": "Value"}
      ]
    },
    "background": "#1f2937",
    "config": {
      "view": {
        "stroke": "transparent",
        "continuousWidth": 600,
        "continuousHeight": 300
      },
      "axis": {
        "domainColor": "#374151",
        "gridColor": "#374151",
        "tickColor": "#374151"
      }
    }
  },
  
  [CHART_TYPES.AREA]: {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "mark": {
      "type": "area",
      "opacity": 0.7,
      "strokeWidth": 2
    },
    "encoding": {
      "x": {
        "field": "year",
        "type": "temporal",
        "axis": {
          "title": "Year",
          "titleColor": "#9ca3af",
          "labelColor": "#9ca3af",
          "grid": false,
          "tickColor": "#374151",
          "domainColor": "#374151"
        }
      },
      "y": {
        "field": "value",
        "type": "quantitative",
        "axis": {
          "titleColor": "#9ca3af",
          "labelColor": "#9ca3af",
          "grid": true,
          "gridColor": "#374151",
          "tickColor": "#374151",
          "domainColor": "#374151"
        }
      },
      "color": {
        "field": "group",
        "type": "nominal",
        "legend": {
          "titleColor": "#9ca3af",
          "labelColor": "#9ca3af",
          "orient": "bottom"
        }
      },
      "tooltip": [
        {"field": "year", "type": "temporal", "title": "Year"},
        {"field": "group", "type": "nominal", "title": "Series"},
        {"field": "value", "type": "quantitative", "title": "Value"}
      ]
    },
    "background": "#1f2937",
    "config": {
      "view": {
        "stroke": "transparent",
        "continuousWidth": 600,
        "continuousHeight": 300
      },
      "axis": {
        "domainColor": "#374151",
        "gridColor": "#374151",
        "tickColor": "#374151"
      }
    }
  }
};

// Helper function to format values based on type
export const formatValue = (value, format) => {
  if (!value && value !== 0) return 'N/A';
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: value >= 1000000 ? 'compact' : 'standard',
        maximumFractionDigits: value >= 1000000 ? 1 : 0
      }).format(value);
    case 'number':
      return new Intl.NumberFormat('en-US', {
        notation: value >= 1000000 ? 'compact' : 'standard',
        maximumFractionDigits: value >= 1000000 ? 1 : 0
      }).format(value);
    default:
      return value.toString();
  }
};

// Helper function to get chart configuration for a dataset
export const getChartConfig = (dataset) => {
  return CHART_CONFIGS[dataset] || CHART_CONFIGS.baci;
};

// Helper function to create a chart specification
export const createChartSpec = (chartType, data, config, selectedMetric, selectedGroupBy) => {
  const baseSpec = BASE_SPECS[chartType];
  if (!baseSpec) return null;

  const metric = config.availableMetrics.find(m => m.value === selectedMetric) || config.availableMetrics[0];
  const groupBy = config.groupByFields.find(g => g.value === selectedGroupBy) || config.groupByFields[0];

  // Create a deep copy of the base spec
  const spec = JSON.parse(JSON.stringify(baseSpec));
  
  // Update the spec with our data and configuration
  spec.data = { values: data };
  
  // Set width more reliably - avoid container width issues
  // Use a fixed responsive width that works consistently
  const getResponsiveWidth = () => {
    if (typeof window !== 'undefined') {
      return Math.min(800, Math.max(400, window.innerWidth * 0.7));
    }
    return 600; // fallback for SSR
  };
  
  spec.width = getResponsiveWidth();
  spec.height = 300;
  
  // Remove autosize since we're using fixed width
  // spec.autosize = {
  //   type: 'fit',
  //   contains: 'padding',
  //   resize: true
  // };
  
  // Alternative: If container width continues to be problematic, 
  // uncomment the following lines to use responsive fixed width:
  // const containerWidth = Math.min(Math.max(window.innerWidth * 0.6, 400), 800);
  // spec.width = containerWidth;
  // spec.autosize = { type: 'none' };
  
  // Update axis labels
  spec.encoding.y.axis.title = metric.label;
  spec.encoding.color.legend.title = groupBy.label;
  
  // Update tooltip to show formatted values
  spec.encoding.tooltip = [
    {field: "year", type: "temporal", title: "Year"},
    {field: "group", type: "nominal", title: groupBy.label},
    {field: "value", type: "quantitative", title: metric.label, format: metric.format === 'currency' ? '$,.0f' : ',.0f'}
  ];

  // Set color scale
  if (config.colors) {
    spec.encoding.color.scale = {
      range: config.colors
    };
  }

  return spec;
};
