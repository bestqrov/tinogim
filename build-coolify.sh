#!/bin/bash
# Coolify build script - Force Docker usage

set -e

echo "🐳 Forcing Docker build for Coolify..."
echo "🔧 Skipping nixpacks detection..."

# Remove any nixpacks generated files
rm -rf .nixpacks || true

# Build using Docker directly
echo "🔨 Building with Dockerfile..."
docker build -t arwa-educ-app .

echo "✅ Docker build completed successfully!"
echo "🚀 Ready to start with: docker run -p 3000:3000 arwa-educ-app"