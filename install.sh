#!/bin/bash

set -e

if [[ "$EUID" -ne 0 ]]; then
  echo "Este script debe ejecutarse como root (sudo)."
  exit 1
fi

if ! grep -q "Ubuntu 22.04" /etc/os-release; then
  echo "Este script está diseñado para Ubuntu 22.04. Abortando."
  exit 1
fi

echo "=== Instalando Sistema de Licencias en Ubuntu 22.04 ==="
echo "Repositorio: https://github.com/kambire/licencia-admin"

echo "1. Instalando dependencias base..."
apt update
apt install -y curl git build-essential ufw nginx

echo "2. Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

echo "3. Clonando repositorio..."
if [ -d "/opt/licencia-admin" ]; then
  rm -rf /opt/licencia-admin
fi
git clone https://github.com/kambire/licencia-admin.git /opt/licencia-admin
cd /opt/licencia-admin

echo "4. Configurando backend..."
cd backend
npm install
cd ..

echo "5. Configurando frontend..."
cd frontend
npm install
npm run build
cd ..

echo "6. Creando servicio systemd para backend..."
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

systemctl daemon-reload
systemctl enable licencia-backend
systemctl start licencia-backend

echo "7. Configurando Nginx..."
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
nginx -t
systemctl restart nginx

echo "8. Configurando firewall..."
ufw allow 80/tcp
ufw allow 22/tcp
ufw --force enable

echo "=== Instalación completada ==="
echo "Accede al sistema en: http://$(hostname -I | awk '{print $1}')"
echo "Backend API: http://$(hostname -I | awk '{print $1}')/api"
echo "Estado del backend: systemctl status licencia-backend"
