#!/bin/bash
set -e

echo "🔄 Starting safe build process..."

# Build backend first
echo "📦 Installing backend dependencies..."
npm ci

echo "🔧 Generating Prisma client..."
npm run prisma:generate

echo "🏗️ Building backend TypeScript..."
npm run build:backend

# Try to build frontend, but don't fail if it doesn't work
echo "🎨 Attempting to build frontend..."
if cd frontend 2>/dev/null; then
    if npm ci 2>/dev/null && npm run build 2>/dev/null; then
        echo "✅ Frontend built successfully!"
        cd ..
    else
        echo "⚠️  Frontend build failed - continuing with API-only mode"
        cd ..
    fi
else
    echo "⚠️  Frontend directory not found - API-only mode"
fi

echo "✅ Backend build completed successfully!"
echo "🚀 Server ready to start"