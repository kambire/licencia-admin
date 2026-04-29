#!/bin/bash

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="/opt/licencia-admin"
ERRORS=0
WARNINGS=0

# Verificar si whiptail está disponible
check_whiptail() {
    if ! command -v whiptail &> /dev/null; then
        return 1
    fi
    return 0
}

# Función para mostrar resultados
show_result() {
    local name=$1
    local status=$2
    local message=$3
    
    if [ "$status" = "OK" ]; then
        echo -e "${GREEN}✓${NC} $name: $message"
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠${NC} $name: $message"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${RED}✗${NC} $name: $message"
        ERRORS=$((ERRORS + 1))
    fi
}

# Verificar si se ejecuta como root
check_root() {
    if [[ "$EUID" -ne 0 ]]; then
        echo -e "${YELLOW}Advertencia: Algunas verificaciones requieren permisos root${NC}"
        echo ""
    fi
}

# Verificar sistema operativo
check_os() {
    if [ -f /etc/os-release ]; then
        local os_name=$(grep PRETTY_NAME /etc/os-release | cut -d'"' -f2)
        show_result "Sistema Operativo" "OK" "$os_name"
    else
        show_result "Sistema Operativo" "WARN" "No se pudo detectar"
    fi
}

# Verificar instalación
check_installation() {
    if [ -d "$APP_DIR" ]; then
        show_result "Instalación" "OK" "Directorio $APP_DIR existe"
    else
        show_result "Instalación" "ERROR" "No se encontró $APP_DIR"
        return 1
    fi
    
    if [ -d "$APP_DIR/.git" ]; then
        local commit=$(cd "$APP_DIR" && git log -1 --oneline 2>/dev/null || echo "N/A")
        show_result "Repositorio Git" "OK" "$commit"
    else
        show_result "Repositorio Git" "WARN" "No es un repositorio git"
    fi
}

# Verificar archivos de configuración
check_config() {
    if [ -f "$APP_DIR/backend/.env" ]; then
        show_result "Archivo .env" "OK" "Existe"
        
        # Verificar variables necesarias
        if grep -q "ADMIN_USER" "$APP_DIR/backend/.env" && \
           grep -q "ADMIN_PASS" "$APP_DIR/backend/.env" && \
           grep -q "JWT_SECRET" "$APP_DIR/backend/.env"; then
            show_result "Variables .env" "OK" "Todas las variables necesarias están presentes"
        else
            show_result "Variables .env" "WARN" "Faltan algunas variables"
        fi
    else
        show_result "Archivo .env" "ERROR" "No existe en backend/.env"
    fi
    
    if [ -f "$APP_DIR/backend/licenses.db" ]; then
        show_result "Base de Datos" "OK" "Archivo SQLite existe"
    else
        show_result "Base de Datos" "WARN" "No existe licenses.db (se creará al iniciar)"
    fi
}

# Verificar Node.js y dependencias
check_node() {
    if command -v node &> /dev/null; then
        local version=$(node --version)
        show_result "Node.js" "OK" "Versión $version"
    else
        show_result "Node.js" "ERROR" "No está instalado"
        return 1
    fi
    
    if [ -d "$APP_DIR/backend/node_modules" ]; then
        show_result "Dependencias Backend" "OK" "node_modules existe"
    else
        show_result "Dependencias Backend" "ERROR" "Falta npm install en backend"
    fi
    
    if [ -d "$APP_DIR/frontend/node_modules" ]; then
        show_result "Dependencias Frontend" "OK" "node_modules existe"
    else
        show_result "Dependencias Frontend" "ERROR" "Falta npm install en frontend"
    fi
    
    if [ -d "$APP_DIR/frontend/dist" ]; then
        show_result "Build Frontend" "OK" "Build de producción existe"
    else
        show_result "Build Frontend" "WARN" "Falta npm run build en frontend"
    fi
}

# Verificar servicios
check_services() {
    # licencia-backend
    if systemctl is-active --quiet licencia-backend; then
        show_result "Servicio Backend" "OK" "licencia-backend está activo"
    else
        show_result "Servicio Backend" "ERROR" "licencia-backend NO está activo"
    fi
    
    # nginx
    if systemctl is-active --quiet nginx; then
        show_result "Servicio Nginx" "OK" "nginx está activo"
    else
        show_result "Servicio Nginx" "ERROR" "nginx NO está activo"
    fi
}

# Verificar conectividad
check_connectivity() {
    # Backend API
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        show_result "API Backend" "OK" "Responde en puerto 3001"
    else
        show_result "API Backend" "ERROR" "No responde en puerto 3001"
    fi
    
    # Frontend
    if curl -s http://localhost/ > /dev/null 2>&1; then
        show_result "Frontend" "OK" "Responde en puerto 80"
    else
        show_result "Frontend" "ERROR" "No responde en puerto 80"
    fi
    
    # IP externa
    local ip=$(hostname -I | awk '{print $1}')
    if [ -n "$ip" ]; then
        show_result "IP del Servidor" "OK" "$ip"
    else
        show_result "IP del Servidor" "WARN" "No se pudo obtener"
    fi
}

# Verificar firewall
check_firewall() {
    if command -v ufw &> /dev/null; then
        if ufw status | grep -q "Status: active"; then
            show_result "Firewall (UFW)" "OK" "Activo"
            
            if ufw status | grep -q "80/tcp"; then
                show_result "Puerto 80" "OK" "Abierto en firewall"
            else
                show_result "Puerto 80" "WARN" "No está abierto"
            fi
        else
            show_result "Firewall (UFW)" "WARN" "Inactivo"
        fi
    else
        show_result "Firewall (UFW)" "WARN" "No instalado"
    fi
}

# Menú interactivo con whiptail
show_menu() {
    if ! check_whiptail; then
        return 1
    fi
    
    local choice=$(whiptail --title "Sistema de Licencias - Check" --menu \
    "Selecciona una acción:\n\nErrores: $ERRORS | Advertencias: $WARNINGS" \
    20 60 10 \
    "1" "Ver todos los logs del backend" \
    "2" "Ver todos los logs de nginx" \
    "3" "Reiniciar servicio backend" \
    "4" "Reiniciar servicio nginx" \
    "5" "Reinstalar dependencias npm" \
    "6" "Reconstruir frontend" \
    "7" "Reiniciar todo" \
    "8" "Salir" \
    3>&1 1>&2 2>&3)
    
    case $choice in
        1)
            whiptail --title "Logs Backend" --textbox /dev/stdin 20 70 -- \
            "$(journalctl -u licencia-backend -n 50 --no-pager 2>&1)"
            show_menu
            ;;
        2)
            whiptail --title "Logs Nginx" --textbox /dev/stdin 20 70 -- \
            "$(tail -50 /var/log/nginx/error.log 2>&1)"
            show_menu
            ;;
        3)
            systemctl restart licencia-backend
            whiptail --title "Info" --msgbox "Servicio backend reiniciado" 8 40
            show_menu
            ;;
        4)
            systemctl restart nginx
            whiptail --title "Info" --msgbox "Servicio nginx reiniciado" 8 40
            show_menu
            ;;
        5)
            cd "$APP_DIR/backend" && npm install
            cd "$APP_DIR/frontend" && npm install
            whiptail --title "Info" --msgbox "Dependencias reinstaladas" 8 40
            show_menu
            ;;
        6)
            cd "$APP_DIR/frontend" && npm run build
            whiptail --title "Info" --msgbox "Frontend reconstruido" 8 40
            show_menu
            ;;
        7)
            systemctl restart licencia-backend
            systemctl restart nginx
            whiptail --title "Info" --msgbox "Todos los servicios reiniciados" 8 40
            show_menu
            ;;
        8)
            exit 0
            ;;
    esac
}

# Mostrar resumen final
show_summary() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Resumen del Sistema${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✓ Sistema funcionando correctamente${NC}"
    elif [ $ERRORS -eq 0 ]; then
        echo -e "${YELLOW}⚠ Sistema funcionando con advertencias${NC}"
    else
        echo -e "${RED}✗ Sistema con errores${NC}"
    fi
    
    echo -e "Errores: $ERRORS | Advertencias: $WARNINGS"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Función principal
main() {
    clear
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Verificación del Sistema de Licencias${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    check_root
    check_os
    check_installation
    check_config
    check_node
    check_services
    check_connectivity
    check_firewall
    
    show_summary
    
    # Sugerir acciones si hay errores
    if [ $ERRORS -gt 0 ]; then
        echo -e "${RED}Se encontraron $ERRORS errores.${NC}"
        echo ""
    fi
    
    if check_whiptail; then
        show_menu
    else
        echo "Tip: Instala 'whiptail' para una interfaz interactiva:"
        echo "  sudo apt install whiptail"
        echo ""
        echo "Comandos útiles:"
        echo "  Ver logs backend: journalctl -u licencia-backend -f"
        echo "  Reiniciar backend: systemctl restart licencia-backend"
        echo "  Reiniciar nginx: systemctl restart nginx"
        echo "  Verificar estado: systemctl status licencia-backend"
    fi
}

main
