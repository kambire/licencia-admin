#!/bin/bash

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar si whiptail está instalado
check_whiptail() {
    if ! command -v whiptail &> /dev/null; then
        echo -e "${YELLOW}Instalando whiptail para interfaz moderna...${NC}"
        apt update -qq
        apt install -y whiptail > /dev/null 2>&1
    fi
}

# Banner
show_banner() {
    whiptail --title "Sistema de Licencias" --msgbox \
    "Bienvenido al instalador del Sistema de Administración de Licencias\n\nRepositorio: https://github.com/kambire/licencia-admin\n\nEste asistente configurará todo automáticamente." \
    12 60
}

# Verificar root
check_root() {
    if [[ "$EUID" -ne 0 ]]; then
        whiptail --title "Error" --msgbox "Este script debe ejecutarse como root (sudo)." 8 50
        exit 1
    fi
}

# Verificar Ubuntu 22.04
check_os() {
    if ! grep -q "Ubuntu 22.04" /etc/os-release; then
        whiptail --title "Advertencia" --yesno "Este script está diseñado para Ubuntu 22.04.\n¿Deseas continuar de todos modos?" 8 60
        if [[ $? -ne 0 ]]; then
            exit 1
        fi
    fi
}

# Generar contraseña admin aleatoria
generate_password() {
    local pass=$(openssl rand -base64 12 | tr -dc 'A-Za-z0-9' | head -c 16)
    echo "$pass"
}

# Mostrar progreso
show_progress() {
    {
        echo XXX
        echo $1
        echo "$2"
        echo XXX
    } | whiptail --gauge "Instalando..." 8 50 0
}

# Instalación paso a paso
install_step1_deps() {
    show_progress 10 "Verificando dependencias base..."
    apt update -qq
    apt install -y curl git build-essential ufw nginx openssl > /dev/null 2>&1
}

install_step2_node() {
    show_progress 25 "Instalando Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - > /dev/null 2>&1
    apt install -y nodejs > /dev/null 2>&1
}

install_step3_clone() {
    show_progress 40 "Clonando repositorio..."
    if [ -d "/opt/licencia-admin" ]; then
        rm -rf /opt/licencia-admin
    fi
    git clone https://github.com/kambire/licencia-admin.git /opt/licencia-admin > /dev/null 2>&1
    cd /opt/licencia-admin
}

install_step4_backend() {
    show_progress 55 "Configurando backend..."
    cd /opt/licencia-admin/backend
    npm install > /dev/null 2>&1
}

install_step5_frontend() {
    show_progress 70 "Configurando frontend..."
    cd /opt/licencia-admin/frontend
    npm install > /dev/null 2>&1
    npm run build > /dev/null 2>&1
}

install_step6_admin() {
    show_progress 80 "Generando credenciales de admin..."
    local admin_pass=$(generate_password)
    local jwt_secret=$(openssl rand -base64 32)
    cat > /opt/licencia-admin/backend/.env <<EOL
PORT=3001
ADMIN_USER=admin
ADMIN_PASS=$admin_pass
JWT_SECRET=$jwt_secret
EOL
    echo "$admin_pass" > /tmp/admin_pass.txt
}

install_step7_services() {
    show_progress 90 "Configurando servicios..."
    cat > /etc/systemd/system/licencia-backend.service <<EOL
[Unit]
Description=Licencia Admin Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/licencia-admin/backend
ExecStart=/usr/bin/node src/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOL

    cat > /etc/nginx/sites-available/licencia-admin <<EOL
server {
    listen 80;
    server_name _;

    location / {
        root /opt/licencia-admin/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

    ln -sf /etc/nginx/sites-available/licencia-admin /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t > /dev/null 2>&1
    systemctl daemon-reload
    systemctl enable licencia-backend > /dev/null 2>&1
    systemctl start licencia-backend
    systemctl restart nginx
}

install_step8_firewall() {
    show_progress 95 "Configurando firewall..."
    ufw allow 80/tcp > /dev/null 2>&1
    ufw allow 22/tcp > /dev/null 2>&1
    ufw --force enable > /dev/null 2>&1
}

# Resumen final
show_summary() {
    local ip=$(hostname -I | awk '{print $1}')
    local pass=$(cat /tmp/admin_pass.txt)
    
    whiptail --title "Instalación Completada" --msgbox \
    "El sistema se ha instalado correctamente.\n\nCredenciales de Administrador:\n\nUsuario: admin\nContraseña: ${pass}\n\nAcceso al sistema:\nhttp://${ip}\n\nBackend API:\nhttp://${ip}/api\n\nIMPORTANTE: Guarda estas credenciales en un lugar seguro." \
    18 60
    
    # Mostrar en terminal también
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Instalación Completada${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "Acceso: ${BLUE}http://${ip}${NC}"
    echo -e "Usuario: ${YELLOW}admin${NC}"
    echo -e "Contraseña: ${YELLOW}${pass}${NC}"
    echo -e "${GREEN}========================================${NC}"
    
    whiptail --title "Contraseña" --msgbox "IMPORTANTE: Tu contraseña de admin es:\n\n${pass}\n\nGuárdala ahora porque no se volverá a mostrar." 12 50
    
    rm -f /tmp/admin_pass.txt
}

# Función principal
main() {
    check_root
    check_os
    check_whiptail
    show_banner
    
    install_step1_deps
    install_step2_node
    install_step3_clone
    install_step4_backend
    install_step5_frontend
    install_step6_admin
    install_step7_services
    install_step8_firewall
    
    show_summary
}

main
