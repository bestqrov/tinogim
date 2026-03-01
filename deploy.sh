#!/bin/bash
# Coolify deployment script for ArwaEduc

set -e

echo "🚀 Starting ArwaEduc deployment..."

# Install dependencies
echo "📦 Installing backend dependencies..."
npm ci --only=production

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate

# Build TypeScript backend
echo "🔨 Building backend..."
npm run build:backend

# Frontend is skipped for now (API-only deployment)
echo "⚠️  Frontend will be added in future deployment"

echo "✅ ArwaEduc API ready for deployment!"