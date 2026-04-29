#!/bin/bash

set -e

if [[ "$EUID" -ne 0 ]]; then
  echo "Este script debe ejecutarse como root (sudo)."
  exit 1
fi

APP_DIR="/opt/licencia-admin"

if [ ! -d "$APP_DIR/.git" ]; then
  echo "Error: No se encontró un repositorio git en $APP_DIR"
  exit 1
fi

echo "=== Actualizando Sistema de Licencias desde GitHub ==="

cd "$APP_DIR"

echo "1. Guardando cambios locales (si los hay)..."
git stash || true

echo "2. Obteniendo últimos cambios..."
git pull origin main

echo "3. Actualizando backend..."
cd backend
npm install
cd ..

echo "4. Actualizando frontend..."
cd frontend
npm install
npm run build
cd ..

echo "5. Reiniciando servicios..."
systemctl restart licencia-backend
systemctl restart nginx

echo "=== Actualización completada ==="
echo "Estado del backend: systemctl status licencia-backend"
