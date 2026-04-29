#!/bin/bash

# Configuración estricta
set -e
trap 'error_handler $? $LINENO' ERR

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Manejo de errores
error_handler() {
    local exit_code=$1
    local line_number=$2
    whiptail --title "Error" --msgbox "Error en la instalación (línea $line_number, código $exit_code).\n\nRevisa los mensajes anteriores." 10 60
    exit $exit_code
}

# Variables para HTTPS
USE_HTTPS=false
DOMAIN_NAME=""
EMAIL=""

# Verificar si whiptail está instalado
check_whiptail() {
    if ! command -v whiptail &> /dev/null; then
        echo -e "${YELLOW}Instalando whiptail para interfaz moderna...${NC}"
        apt update -qq 2>/dev/null
        apt install -y whiptail > /dev/null 2>&1 || true
        if ! command -v whiptail &> /dev/null; then
            echo -e "${RED}No se pudo instalar whiptail. Continuando sin interfaz gráfica...${NC}"
        fi
    fi
}

# Función para mostrar progreso
show_progress() {
    local percent=$1
    local message=$2
    
    if command -v whiptail &> /dev/null; then
        {
            echo XXX
            echo $percent
            echo "$message"
            echo XXX
        } | whiptail --gauge "Instalando Sistema de Licencias" 8 50 0
    else
        echo -e "${BLUE}[$percent%]${NC} $message"
    fi
}

# Banner inicial
show_banner() {
    if command -v whiptail &> /dev/null; then
        whiptail --title "Sistema de Licencias" --msgbox \
        "Bienvenido al instalador del Sistema de Administración de Licencias\n\nRepositorio: https://github.com/kambire/licencia-admin\n\nEste asistente configurará todo automáticamente para Ubuntu22.04." \
        12 60
    else
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}  Sistema de Administración de Licencias${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo -e "Repositorio: https://github.com/kambire/licencia-admin"
        echo ""
    fi
}

# Preguntar sobre HTTPS
ask_https() {
    if command -v whiptail &> /dev/null; then
        if whiptail --title "HTTPS/SSL" --yesno "¿Deseas configurar HTTPS con Let's Encrypt?\n\nNecesitas:\n- Un dominio apuntando a este servidor\n- Puerto 80 abierto\n- Puerto 443 abierto" 12 60; then
            USE_HTTPS=true
            DOMAIN_NAME=$(whiptail --title "Dominio" --inputbox "Ingresa tu dominio (ejemplo: licencias.tudominio.com):" 8 50 3>&1 1>&2 2>&3)
            EMAIL=$(whiptail --title "Email" --inputbox "Ingresa tu email para Let's Encrypt:" 8 50 3>&1 1>&2 2>&3)
        fi
    else
        read -p "¿Configurar HTTPS con Let's Encrypt? (y/N): " confirm
        if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
            USE_HTTPS=true
            read -p "Dominio (ejemplo: licencias.tudominio.com): " DOMAIN_NAME
            read -p "Email para Let's Encrypt: " EMAIL
        fi
    fi
}

# Verificar root
check_root() {
    if [[ "$EUID" -ne 0 ]]; then
        if command -v whiptail &> /dev/null; then
            whiptail --title "Error" --msgbox "Este script debe ejecutarse como root (usa: sudo bash install.sh)" 8 60
        else
            echo -e "${RED}Este script debe ejecutarse como root (usa: sudo bash install.sh)${NC}"
        fi
        exit 1
    fi
}

# Verificar Ubuntu 22.04
check_os() {
    if ! grep -q "Ubuntu 22.04" /etc/os-release; then
        if command -v whiptail &> /dev/null; then
            if ! whiptail --title "Advertencia" --yesno "Este script está diseñado para Ubuntu 22.04.\nSistema detectado: $(grep PRETTY_NAME /etc/os-release | cut -d'"' -f2)\n\n¿Deseas continuar de todos modos?" 10 60; then
                exit 1
            fi
        else
            echo -e "${YELLOW}Advertencia: Este script está diseñado para Ubuntu 22.04.${NC}"
            echo -e "Sistema detectado: $(grep PRETTY_NAME /etc/os-release | cut -d'"' -f2)"
            read -p "¿Continuar? (y/N): " confirm
            if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
                exit 1
            fi
        fi
    fi
}

# Generar contraseña admin aleatoria
generate_password() {
    openssl rand -base64 12 | tr -dc 'A-Za-z0-9' | head -c 16
}

# Instalación paso a paso
install_step1_deps() {
    show_progress 10 "Actualizando repositorios..."
    apt update -y > /dev/null 2>&1
    
    show_progress 15 "Instalando dependencias base..."
    apt install -y curl git build-essential ufw nginx openssl certbot python3-certbot-nginx > /dev/null 2>&1
    
    # Verificar instalación de nginx
    if ! command -v nginx &> /dev/null; then
        echo -e "${RED}Error: No se pudo instalar Nginx${NC}"
        return 1
    fi
}

install_step2_node() {
    show_progress 25 "Instalando Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - > /dev/null 2>&1
    apt install -y nodejs > /dev/null 2>&1
    
    # Verificar instalación de Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: No se pudo instalar Node.js${NC}"
        return 1
    fi
    
    show_progress 30 "Verificando Node.js..."
    node_version=$(node --version)
    echo -e "${GREEN}Node.js instalado: $node_version${NC}"
}

install_step3_clone() {
    show_progress 40 "Clonando repositorio..."
    
    # Limpiar instalación previa si existe
    if [ -d "/opt/licencia-admin" ]; then
        show_progress 42 "Eliminando instalación previa..."
        rm -rf /opt/licencia-admin
    fi
    
    git clone https://github.com/kambire/licencia-admin.git /opt/licencia-admin > /dev/null 2>&1
    
    if [ ! -d "/opt/licencia-admin" ]; then
        echo -e "${RED}Error: No se pudo clonar el repositorio${NC}"
        return 1
    fi
    
    cd /opt/licencia-admin
}

install_step4_backend() {
    show_progress 55 "Configurando backend..."
    
    cd /opt/licencia-admin/backend
    
    # Instalar dependencias
    npm install > /dev/null 2>&1
    
    if [ ! -f "package.json" ]; then
        echo -e "${RED}Error: No se pudo configurar el backend${NC}"
        return 1
    fi
}

install_step5_frontend() {
    show_progress 65 "Configurando frontend..."
    
    cd /opt/licencia-admin/frontend
    
    # Instalar dependencias
    npm install > /dev/null 2>&1
    
    show_progress 70 "Compilando frontend (build de producción)..."
    npm run build > /dev/null 2>&1
    
    if [ ! -d "dist" ]; then
        echo -e "${RED}Error: No se pudo compilar el frontend${NC}"
        return 1
    fi
}

install_step6_admin() {
    show_progress 80 "Generando credenciales de administrador..."
    
    local admin_pass=$(generate_password)
    local jwt_secret=$(openssl rand -base64 32)
    
    # Crear archivo .env completo
    cat > /opt/licencia-admin/backend/.env <<EOL
PORT=3001
ADMIN_USER=admin
ADMIN_PASS=$admin_pass
JWT_SECRET=$jwt_secret
EOL
    
    # Guardar contraseña para mostrarla al final
    echo "$admin_pass" > /tmp/admin_pass.txt
    
    # Asegurar permisos
    chmod 600 /opt/licencia-admin/backend/.env
}

install_step7_services() {
    show_progress 85 "Creando servicio systemd para backend..."
    
    cat > /etc/systemd/system/licencia-backend.service <<'EOL'
[Unit]
Description=Licencia Admin Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/licencia-admin/backend
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOL
    
    show_progress 88 "Configurando Nginx..."
    
    if [ "$USE_HTTPS" = true ] && [ -n "$DOMAIN_NAME" ]; then
        # Configuración con HTTPS
        cat > /etc/nginx/sites-available/licencia-admin <<EOL
server {
    listen 80;
    server_name $DOMAIN_NAME;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN_NAME;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem;

    # Frontend
    location / {
        root /opt/licencia-admin/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOL
    else
        # Configuración HTTP normal
        cat > /etc/nginx/sites-available/licencia-admin <<'EOL'
server {
    listen 80;
    server_name _;
    
    # Frontend
    location / {
        root /opt/licencia-admin/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOL
    fi
    
    # Activar configuración de Nginx
    ln -sf /etc/nginx/sites-available/licencia-admin /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Verificar configuración de Nginx
    nginx -t > /dev/null 2>&1 || {
        echo -e "${RED}Error en configuración de Nginx${NC}"
        return 1
    }
    
    show_progress 92 "Iniciando servicios..."
    
    systemctl daemon-reload
    systemctl enable licencia-backend > /dev/null 2>&1
    systemctl start licencia-backend
    
    # Verificar que el backend inició
    sleep 3
    if ! systemctl is-active --quiet licencia-backend; then
        echo -e "${RED}Error: El servicio backend no pudo iniciar${NC}"
        journalctl -u licencia-backend --no-pager -n 20
        return 1
    fi
    
    systemctl restart nginx
    
    # Verificar que Nginx inició
    if ! systemctl is-active --quiet nginx; then
        echo -e "${RED}Error: Nginx no pudo iniciar${NC}"
        return 1
    fi
}

install_step8_firewall() {
    show_progress 95 "Configurando firewall (UFW)..."
    
    # Configurar UFW
    ufw --force reset > /dev/null 2>&1
    ufw default deny incoming > /dev/null 2>&1
    ufw default allow outgoing > /dev/null 2>&1
    ufw allow 22/tcp comment 'SSH' > /dev/null 2>&1
    ufw allow 80/tcp comment 'HTTP' > /dev/null 2>&1
    
    if [ "$USE_HTTPS" = true ]; then
        ufw allow 443/tcp comment 'HTTPS' > /dev/null 2>&1
    fi
    
    ufw --force enable > /dev/null 2>&1
}

install_step9_ssl() {
    if [ "$USE_HTTPS" = true ] && [ -n "$DOMAIN_NAME" ] && [ -n "$EMAIL" ]; then
        show_progress 97 "Configurando SSL con Let's Encrypt..."
        
        # Obtener certificado
        certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos --email "$EMAIL" --no-eff-email > /dev/null 2>&1 || {
            echo -e "${YELLOW}Advertencia: No se pudo configurar SSL automáticamente${NC}"
            echo -e "${YELLOW}Asegúrate de que el dominio $DOMAIN_NAME apunte a este servidor${NC}"
        }
        
        # Configurar renovación automática
        echo "0 2 * * * certbot renew --quiet" | crontab -
    fi
}

# Verificación final
verify_installation() {
    show_progress 98 "Verificando instalación..."
    
    local ip=$(hostname -I | awk '{print $1}')
    local errors=0
    
    # Verificar backend
    if ! curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo -e "${RED}Error: Backend no responde${NC}"
        errors=$((errors + 1))
    fi
    
    # Verificar frontend
    if ! curl -s http://localhost/ > /dev/null 2>&1; then
        echo -e "${RED}Error: Frontend no responde${NC}"
        errors=$((errors + 1))
    fi
    
    return $errors
}

# Resumen final
show_summary() {
    local ip=$(hostname -I | awk '{print $1}')
    local pass=$(cat /tmp/admin_pass.txt 2>/dev/null || echo "ERROR: No se pudo leer la contraseña")
    
    local access_url="http://${ip}"
    if [ "$USE_HTTPS" = true ] && [ -n "$DOMAIN_NAME" ]; then
        access_url="https://${DOMAIN_NAME}"
    fi
    
    if command -v whiptail &> /dev/null; then
        whiptail --title "Instalación Completada" --msgbox \
        "El sistema se ha instalado y configurado correctamente.\n\nCredenciales de Administrador:\n\nUsuario: admin\nContraseña: ${pass}\n\nAcceso al sistema:\n${access_url}\n\nBackend API:\n${access_url}/api\n\nIMPORTANTE: Guarda estas credenciales en un lugar seguro. La contraseña no se volverá a mostrar." \
        22 70
    fi
    
    # Mostrar en terminal también
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Instalación Completada${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "Acceso al sistema: ${BLUE}${access_url}${NC}"
    echo -e "Usuario: ${YELLOW}admin${NC}"
    echo -e "Contraseña: ${YELLOW}${pass}${NC}"
    echo -e "Backend API: ${BLUE}${access_url}/api${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${YELLOW}IMPORTANTE: Guarda estas credenciales ahora.${NC}"
    echo -e "${YELLOW}La contraseña NO se volverá a mostrar.${NC}"
    echo ""
    
    # Mostrar contraseña en whiptail para que el usuario la guarde
    if command -v whiptail &> /dev/null; then
        whiptail --title "¡GUARDA ESTA CONTRASEÑA!" --msgbox "Tu contraseña de administrador es:\n\n${pass}\n\nCópiala y guárdala en un lugar seguro.\nEsta es la ÚNICA vez que se mostrará." 12 50
    fi
    
    # Limpiar archivo temporal
    rm -f /tmp/admin_pass.txt
    
    # Mostrar comandos útiles
    echo -e "${BLUE}Comandos útiles:${NC}"
    echo "  Ver logs backend: journalctl -u licencia-backend -f"
    echo "  Reiniciar backend: systemctl restart licencia-backend"
    echo "  Verificar estado: systemctl status licencia-backend"
    echo "  Actualizar sistema: sudo bash /opt/licencia-admin/update.sh"
    echo "  Verificar sistema: sudo bash /opt/licencia-admin/check.sh"
    echo "  Backup: sudo bash /opt/licencia-admin/backup.sh"
    echo ""
}

# Función principal
main() {
    check_root
    check_os
    check_whiptail
    show_banner
    ask_https
    
    install_step1_deps
    install_step2_node
    install_step3_clone
    install_step4_backend
    install_step5_frontend
    install_step6_admin
    install_step7_services
    install_step8_firewall
    install_step9_ssl
    
    if verify_installation; then
        show_summary
    else
        echo -e "${RED}La instalación se completó pero hay errores. Revisa los mensajes anteriores.${NC}"
        exit 1
    fi
}

main
