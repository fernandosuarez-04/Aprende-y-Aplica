#!/bin/bash
set -e

echo "🚀 Iniciando build en Netlify..."

# Configurar NODE_ENV para instalar devDependencies (TypeScript)
export NODE_ENV=development

echo "📦 Instalando dependencias (incluyendo devDependencies)..."
npm install --legacy-peer-deps

echo "🔨 Construyendo paquetes compartidos..."
npm run build:packages

# Configurar NODE_ENV para producción antes del build final
export NODE_ENV=production

echo "🌐 Construyendo aplicación Next.js..."
npm run build:web

echo "✅ Build completado exitosamente!"
