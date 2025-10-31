#!/bin/bash
set -e

echo "🚀 Iniciando build en Netlify..."

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Construir paquetes compartidos
echo "🔨 Construyendo paquetes compartidos..."
npm run prepare

# Construir aplicación web
echo "🌐 Construyendo aplicación Next.js..."
npm run build --workspace=apps/web

echo "✅ Build completado exitosamente!"

