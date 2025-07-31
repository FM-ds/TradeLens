#!/bin/bash

# Build script that handles environment-specific configurations
ENV=${1:-development}

echo "Building for environment: $ENV"

# Copy the appropriate config file
if [ "$ENV" = "production" ]; then
    cp src/config/datasources/config.production.json src/config/datasources/config.json
    echo "Using production API: http://ec2-3-8-87-255.eu-west-2.compute.amazonaws.com:8000"
else
    cp src/config/datasources/config.development.json src/config/datasources/config.json
    echo "Using development API: http://127.0.0.1:8000"
fi

# Run the build
npm run build

echo "Build completed for $ENV environment"
