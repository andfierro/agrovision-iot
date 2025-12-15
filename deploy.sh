#!/bin/bash

echo "🔨 Construyendo aplicación..."
npm run build

echo "📁 Verificando estructura de carpetas..."
if [ ! -d "dist/model" ]; then
    echo "⚠️ Copiando modelo a dist..."
    mkdir -p dist/model
    cp -r public/model/* dist/model/ 2>/dev/null || echo "Modelo no encontrado en public/"
fi

echo "🚀 Desplegando en GitHub Pages..."
npm run deploy

echo "✅ ¡Despliegue completado!"