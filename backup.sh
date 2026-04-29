#!/bin/bash

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="/opt/licencia-admin"
BACKUP_DIR="/opt/licencia-backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Backup del Sistema de Licencias${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Crear directorio de backups
mkdir -p "$BACKUP_DIR"

# Backup de la base de datos
if [ -f "$APP_DIR/backend/licenses.db" ]; then
    cp "$APP_DIR/backend/licenses.db" "$BACKUP_DIR/licenses_$DATE.db"
    echo -e "${GREEN}✓${NC} Base de datos respaldada: licenses_$DATE.db"
else
    echo -e "${YELLOW}⚠${NC} No se encontró licenses.db (se creará al iniciar el sistema)"
fi

# Backup del archivo .env (configuración)
if [ -f "$APP_DIR/backend/.env" ]; then
    cp "$APP_DIR/backend/.env" "$BACKUP_DIR/env_$DATE.env"
    echo -e "${GREEN}✓${NC} Configuración respaldada: env_$DATE.env"
else
    echo -e "${YELLOW}⚠${NC} No se encontró archivo .env"
fi

# Backup completo del repositorio (sin node_modules)
if [ -d "$APP_DIR/.git" ]; then
    cd "$APP_DIR"
    tar --exclude='node_modules' --exclude='.git' --exclude='dist' -czf "$BACKUP_DIR/full_backup_$DATE.tar.gz" .
    echo -e "${GREEN}✓${NC} Backup completo creado: full_backup_$DATE.tar.gz"
fi

# Limpiar backups antiguos (mantener últimos 7 días)
find "$BACKUP_DIR" -type f -mtime +7 -delete 2>/dev/null
echo -e "${GREEN}✓${NC} Backups antiguos limpiados (más de 7 días)"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Backup Completado${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Ubicación: ${BLUE}$BACKUP_DIR${NC}"
ls -lh "$BACKUP_DIR" | tail -n +2
echo ""

# Opción para restaurar
if command -v whiptail &> /dev/null; then
    if whiptail --title "Backup" --yesno "¿Deseas configurar backups automáticos con cron?" 8 60; then
        # Agregar a crontab (diario a las 2 AM)
        (crontab -l 2>/dev/null | grep -v "backup.sh"; echo "0 2 * * * sudo bash $APP_DIR/backup.sh > /dev/null 2>&1") | crontab -
        whiptail --title "Backup" --msgbox "Backup automático configurado.\nSe ejecutará diariamente a las 2 AM." 8 50
    fi
fi
