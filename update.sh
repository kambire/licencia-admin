#!/bin/bash

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

APP_DIR="/opt/licencia-admin"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Actualizando Sistema de Licencias${NC}"
echo -e "${GREEN}========================================${NC}"

if [[ "$EUID" -ne 0 ]]; then
    echo -e "${RED}Este script debe ejecutarse como root (sudo).${NC}"
    exit 1
fi

if [ ! -d "$APP_DIR/.git" ]; then
    echo -e "${RED}Error: No se encontró un repositorio git en $APP_DIR${NC}"
    exit 1
fi

cd "$APP_DIR"

# Guardar cambios locales si los hay
echo -e "${YELLOW}1. Guardando cambios locales (si los hay)...${NC}"
git stash 2>/dev/null || true

# Guardar .env actual
if [ -f "$APP_DIR/backend/.env" ]; then
    echo -e "${YELLOW}2. Respaldando configuración...${NC}"
    cp "$APP_DIR/backend/.env" "/tmp/.env.backup"
fi

# Obtener últimos cambios
echo -e "${YELLOW}3. Obteniendo últimos cambios de GitHub...${NC}"
git pull origin main

# Restaurar .env si fue sobrescrito
if [ -f "/tmp/.env.backup" ]; then
    echo -e "${YELLOW}4. Restaurando configuración...${NC}"
    cp "/tmp/.env.backup" "$APP_DIR/backend/.env"
    rm -f "/tmp/.env.backup"
fi

# Actualizar backend
echo -e "${YELLOW}5. Actualizando backend...${NC}"
cd "$APP_DIR/backend"
npm install

# Actualizar frontend
echo -e "${YELLOW}6. Actualizando frontend...${NC}"
cd "$APP_DIR/frontend"
npm install
npm run build

# Reiniciar servicios
echo -e "${YELLOW}7. Reiniciando servicios...${NC}"
systemctl restart licencia-backend
sleep 2
systemctl restart nginx

# Verificar estado
echo -e "${YELLOW}8. Verificando servicios...${NC}"
if systemctl is-active --quiet licencia-backend && systemctl is-active --quiet nginx; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Actualización Completada${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "Estado del backend: ${GREEN}Activo${NC}"
    echo -e "Estado de Nginx: ${GREEN}Activo${NC}"
    echo -e "Acceso: ${YELLOW}http://$(hostname -I | awk '{print $1}')${NC}"
else
    echo -e "${RED}Error: Uno o más servicios no iniciaron correctamente${NC}"
    echo "Verifica los logs: journalctl -u licencia-backend -n 20"
    exit 1
fi

echo -e "${GREEN}========================================${NC}"
