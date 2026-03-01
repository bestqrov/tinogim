#!/bin/bash
set -e

echo "🔄 Starting build process..."

echo "📦 Installing dependencies..."
npm ci

echo "🔧 Generating Prisma client..."
npm run prisma:generate

echo "🏗️ Building TypeScript..."
npm run build

echo "✅ Build completed successfully!"