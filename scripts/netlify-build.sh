#!/bin/bash
set -e  # Exit on error

echo "🚀 Starting Netlify build for Aprende y Aplica monorepo..."

# Ensure TypeScript is available for building packages
# Netlify doesn't install devDependencies in production, so we need to install TypeScript
echo "📦 Installing TypeScript for package builds..."
# Temporarily set NODE_ENV to development to ensure devDependencies are available
export NODE_ENV=development
npm install typescript@^5.3.3 --save-dev --no-save
export NODE_ENV=production

# Build shared packages first
echo "📦 Building @aprende-y-aplica/shared package..."
npm run build --workspace=@aprende-y-aplica/shared

echo "📦 Building @aprende-y-aplica/ui package..."
npm run build --workspace=@aprende-y-aplica/ui

# Build the web app
echo "🌐 Building Next.js web app..."
npm run build --workspace=apps/web

echo "✅ Build completed successfully!"

