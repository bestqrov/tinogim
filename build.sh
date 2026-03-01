#!/bin/bash
set -e

echo "🔄 Starting build process..."

echo "📦 Installing dependencies..."
npm ci

echo "🎨 Building frontend..."
cd frontend
npm ci
npm run build
cd ..

echo "🔧 Generating Prisma client..."
npm run prisma:generate

echo "🏗️ Building backend TypeScript..."
npm run build:backend

echo "✅ Build completed successfully!"
echo "📁 Frontend built to: frontend/dist/"
echo "📁 Backend built to: dist/"