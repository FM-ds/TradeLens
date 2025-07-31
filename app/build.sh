#!/bin/bash

# Build script that handles environment-specific configurations
ENV=${1:-development}

echo "Building for environment: $ENV"

# Copy the appropriate config file
if [ "$ENV" = "production" ]; then
    cp src/config/datasources/config.production.json src/config/datasources/config.json
    echo "Using production API: https://api.tradelens.uk"
else
    cp src/config/datasources/config.development.json src/config/datasources/config.json
    echo "Using development API: http://127.0.0.1:8000"
fi

# Run the build
npm run build

echo "Build completed for $ENV environment"
