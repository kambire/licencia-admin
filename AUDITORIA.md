# 📋 AUDITORÍA DEL PROYECTO - Sistema de Administración de Licencias

> **Guía de memoria completa** para entender, mantener y expandir el proyecto en el futuro.

---

## 🎯 Objetivo del Proyecto

Crear un **sistema completo de administración de licencias** que permita:
- Gestionar licencias de software, documentos, servicios y uso general
- Validar licencias desde sistemas externos (como AzerothCore)
- Proveer una interfaz web moderna y segura
- Instalación automatizada en Ubuntu 22.04 con soporte HTTPS
- Seguridad robusta con múltiples capas de protección

---

## 🏗️ Arquitectura del Sistema

### Estructura de Directorios
```
licencia-admin/
├── backend/                    # API REST (Node.js + Express)
│   ├── src/
│   │   ├── db/
│   │   │   └── database.js      # Configuración SQLite
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT Authentication
│   │   │   ├── ipWhitelist.js   # IP Filtering
│   │   │   └── rateLimit.js     # Rate Limiting
│   │   ├── models/
│   │   │   ├── License.js       # Modelo de Licencias
│   │   │   ├── User.js          # Modelo de Usuarios
│   │   │   └── AuditLog.js     # Modelo de Logs
│   │   ├── routes/
│   │   │   ├── licenses.js      # Rutas de licencias
│   │   │   └── users.js         # Rutas de usuarios
│   │   └── index.js            # Entrada del servidor
│   ├── .env                    # Variables de entorno (NO versionar)
│   └── package.json
│
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── components/        # (Reservado para futuros componentes)
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Lista con paginación/filtros
│   │   │   ├── CreateLicense.jsx  # Crear/Editar licencia
│   │   │   ├── ValidateLicense.jsx # Validación manual
│   │   │   ├── Login.jsx          # Inicio de sesión
│   │   │   ├── Users.jsx          # Gestión de usuarios
│   │   │   ├── Statistics.jsx     # Gráficos y estadísticas
│   │   │   └── ChangePassword.jsx # Cambio de contraseña
│   │   ├── services/
│   │   │   └── api.js           # Cliente API centralizado
│   │   ├── App.jsx              # Router principal
│   │   └── main.jsx             # Entrada React
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── install.sh                 # Instalador Ubuntu 22.04 (con whiptail + HTTPS)
├── update.sh                  # Actualizador desde GitHub
├── check.sh                   # Verificador y reparador de sistema
├── backup.sh                  # Script de respaldos
├── INTEGRATION_PROMPT.md     # Guía para integrar con otros sistemas
├── README.md                  # Documentación pública (moderna)
├── AUDITORIA.md              # ESTE ARCHIVO - Guía de memoria
└── .gitignore
```

---

## 🔧 Stack Tecnológico

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Node.js** | 18.x | Runtime de JavaScript |
| **Express** | 4.18.2 | Framework web / API REST |
| **better-sqlite3** | 9.2.2 | Base de datos embebida |
| **jsonwebtoken** | 9.0.2 | Autenticación JWT |
| **bcryptjs** | 2.4.3 | Hash de contraseñas |
| **express-rate-limit** | 7.1.5 | Protección contra abusos |
| **ip-range-check** | 0.2.0 | Validación de rangos IP |
| **dotenv** | 16.3.1 | Variables de entorno |
| **cors** | 2.8.5 | Cross-Origin Resource Sharing |

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 18.2.0 | Biblioteca UI |
| **Vite** | 5.0 | Build tool (rápido) |
| **React Router DOM** | 6.20.0 | Enrutamiento |
| **axios** | 1.6.2 | Cliente HTTP |

### Infraestructura
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Nginx** | 1.18+ | Proxy inverso y servidor estático |
| **Systemd** | 249+ | Gestión de servicios |
| **UFW** | - | Firewall (Ubuntu) |
| **Let's Encrypt** | - | Certificados SSL gratuitos |
| **whiptail** | - | GUI en terminal (instalador) |

---

## 💾 Base de Datos (SQLite)

### Tabla: `licenses`
```sql
CREATE TABLE licenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,           -- Clave tipo XXXX-XXXX-XXXX-XXXX
    type TEXT NOT NULL DEFAULT 'general',    -- software/document/service/general
    status TEXT NOT NULL DEFAULT 'active',  -- active/expired/revoked
    owner TEXT,                            -- Propietario
    description TEXT,                       -- Descripción libre
    metadata TEXT,                           -- JSON con datos extra
    bound_ip TEXT,                          -- IP vinculada (opcional)
    bound_hardware TEXT,                    -- Hardware ID vinculado
    validation_count INTEGER DEFAULT 0,        -- Contador de usos
    last_validated_at TEXT,                  -- Última validación
    createdAt TEXT NOT NULL,                 -- Fecha creación
    expiresAt TEXT,                          -- Fecha expiración (NULL = nunca)
    updatedAt TEXT                           -- Última actualización
);
```

### Tabla: `users`
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,               -- Hash bcrypt
    role TEXT NOT NULL DEFAULT 'viewer', -- admin/viewer
    createdAt TEXT NOT NULL,
    updatedAt TEXT
);
```

### Tabla: `audit_logs`
```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,                          -- NULL si acción anónima
    action TEXT NOT NULL,                    -- CREATE_LICENSE, VALIDATE_LICENSE, etc.
    details TEXT,                             -- JSON con detalles
    ipAddress TEXT,                         -- IP de origen
    timestamp TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
);
```

---

## 🔐 Seguridad Implementada

### 1. Autenticación (JWT)
- **Login:** `POST /api/licenses/login` con usuario/contraseña
- **Token:** JWT con expiración de 24 horas
- **Uso:** Header `Authorization: Bearer <token>`
- **Middleware:** `auth.js` valida el token en rutas protegidas

### 2. IP Whitelist
- **Archivo:** `backend/src/middleware/ipWhitelist.js`
- **Configuración:** Variable `ALLOWED_IPS` en `.env`
- **Formato:** IPs separadas por comas, soporta CIDR (`192.168.1.0/24`)
- **Comportamiento:** Si está vacío, permite todas las IPs

### 3. Rate Limiting
| Tipo de Ruta | Límite | Ventana |
|---------------|--------|--------|
| **Login** | 5 intentos | 15 minutos |
| **Validate** | 30 peticiones | 1 minuto |
| **General** | 100 peticiones | 15 minutos |

### 4. Encriptación
- **Contraseñas:** bcryptjs con salt rounds = 10
- **JWT Secret:** Generado aleatoriamente en instalación (32 bytes base64)
- **Admin Password:** Generada aleatoriamente (16 caracteres alfanuméricos)

### 5. Validación de Entrada
- Todas las rutas validan parámetros requeridos
- Sanitización de datos antes de SQLite
- Validación de tipos en filtros

---

## 🔌 API Endpoints Completos

### Autenticación
| Método | Endpoint | Auth Requerida | Descripción |
|--------|----------|-----------------|-------------|
| POST | `/api/licenses/login` | ❌ No | Obtener token JWT |

### Licencias
| Método | Endpoint | Auth | Descripción | Parámetros |
|--------|----------|------|-------------|------------|
| GET | `/api/licenses` | ✅ Sí | Listar licencias | `type`, `status`, `search`, `limit`, `offset` |
| POST | `/api/licenses` | ✅ Sí | Crear licencia | Body: `key`, `type`, `status`, `owner`, `bound_ip`, etc. |
| GET | `/api/licenses/:id` | ✅ Sí | Obtener por ID | - |
| PUT | `/api/licenses/:id` | ✅ Sí | Actualizar | Body: campos a actualizar |
| DELETE | `/api/licenses/:id` | ✅ Sí | Eliminar | - |
| POST | `/api/licenses/validate` | ❌ No* | Validar clave | Body: `key`, `hardwareId` (opcional) |
| GET | `/api/licenses/statistics` | ✅ Sí (admin) | Estadísticas | - |
| GET | `/api/licenses/export` | ✅ Sí (admin) | Exportar CSV | - |
| GET | `/api/licenses/count` | ✅ Sí | Contar licencias | `type`, `status`, `search` |
| GET | `/api/licenses/generate-key` | ✅ Sí | Generar clave | - |

*La validación usa rate limiting pero no requiere JWT

### Usuarios
| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/users` | ✅ Sí (admin) | Listar usuarios |
| POST | `/api/users` | ✅ Sí (admin) | Crear usuario |
| PUT | `/api/users/:id` | ✅ Sí (self/admin) | Actualizar usuario |
| DELETE | `/api/users/:id` | ✅ Sí (admin) | Eliminar usuario |
| POST | `/api/users/change-password` | ✅ Sí (self) | Cambiar contraseña |
| GET | `/api/users/audit-logs` | ✅ Sí (admin) | Ver logs |

### Sistema
| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/health` | ❌ No | Estado del backend |
| GET | `/api/heartbeat` | ❌ No* | Heartbeat para sistemas externos |

*Protegido por IP whitelist si está configurada

---

## 🖥️ Frontend - Páginas

### 1. Login (`/login`)
- **Propósito:** Inicio de sesión
- **Componente:** `Login.jsx`
- **Características:** Diseño gradiente moderno, validación de credenciales, almacena token en localStorage

### 2. Dashboard (`/`)
- **Propósito:** Vista principal de licencias
- **Componente:** `Dashboard.jsx`
- **Características:**
  - Paginación (10 por página)
  - Búsqueda por texto (clave, propietario, descripción)
  - Filtros por tipo y estado
  - Muestra: validaciones, IP vinculada, fechas
  - Acciones rápidas: Editar/Eliminar

### 3. Crear/Editar Licencia (`/create` y `/create/:id`)
- **Componente:** `CreateLicense.jsx`
- **Campos:**
  - Clave (auto-generada con botón)
  - Tipo (general/software/document/service)
  - Estado (active/expired/revoked)
  - Propietario
  - Descripción
  - Fecha expiración (opcional)
  - **IP Vinculada** (opcional, soporta CIDR)
  - **Hardware ID Vinculado** (opcional, para AzerothCore)

### 4. Validar Licencia (`/validate`)
- **Componente:** `ValidateLicense.jsx`
- **Función:** Validación manual de claves
- **Muestra:** Resultado detallado con todos los campos de la licencia

### 5. Usuarios (`/users`) - Solo Admin
- **Componente:** `Users.jsx`
- **Acciones:** Crear, editar, eliminar usuarios
- **Roles:** `admin` (acceso total) y `viewer` (solo lectura)

### 6. Estadísticas (`/statistics`) - Solo Admin
- **Componente:** `Statistics.jsx`
- **Muestra:**
  - Tarjetas: Total, Activas, Expiradas, Revocadas
  - Por tipo: Software, Documento, Servicio, General
  - Logs de auditoría (últimos 50)
  - Contador de validaciones totales y promedio

### 7. Cambiar Contraseña (`/change-password`)
- **Componente:** `ChangePassword.jsx`
- **Validación:** Contraseña actual obligatoria, nueva debe coincidir
- **Requisito:** Mínimo 6 caracteres

---

## 🛠️ Scripts de Sistema (Ubuntu 22.04)

### 1. `install.sh` - Instalador Completo
**Uso:** `sudo bash install.sh`

**Qué hace:**
1. ✅ Verifica sistema operativo (Ubuntu 22.04 recomendado)
2. ✅ Instala whiptail (GUI en terminal)
3. ✅ Pregunta por HTTPS (Let's Encrypt)
4. ✅ Instala dependencias: curl, git, build-essential, ufw, nginx, certbot
5. ✅ Instala Node.js 18 vía NodeSource
6. ✅ Clona repositorio en `/opt/licencia-admin`
7. ✅ Configura backend (npm install)
8. ✅ Configura frontend (npm install + build)
9. ✅ Genera credenciales automáticamente:
   - `ADMIN_PASS`: 16 caracteres alfanuméricos
   - `JWT_SECRET`: 32 bytes base64
10. ✅ Crea servicio systemd `licencia-backend`
11. ✅ Configura Nginx:
    - HTTP: Proxy inverso puerto 80 → frontend (dist) y API (/api → :3001)
    - HTTPS: Certificado SSL, redirección 301
12. ✅ Configura firewall UFW (puertos 22, 80, 443)
13. ✅ Muestra credenciales (interfaz + terminal)

**Variables generadas en `.env`:**
```env
PORT=3001
ADMIN_USER=admin
ADMIN_PASS=Ab3Cd5Ef7Gh9Ij1K  # Generado aleatoriamente
JWT_SECRET=abc123...xyz789==    # Generado aleatoriamente
ALLOWED_IPS=                    # Vacío por defecto
```

### 2. `update.sh` - Actualizador
**Uso:** `sudo bash /opt/licencia-admin/update.sh`

**Qué hace:**
1. ✅ Guarda cambios locales (git stash)
2. ✅ Respalda `.env` actual
3. ✅ Hace `git pull origin main`
4. ✅ Restaura `.env` (no sobreescribe configuración)
5. ✅ Reinstala dependencias npm (backend y frontend)
6. ✅ Reconstruye frontend (`npm run build`)
7. ✅ Reinicia servicios (`licencia-backend` y `nginx`)

### 3. `check.sh` - Verificador y Reparador
**Uso:** `sudo bash /opt/licencia-admin/check.sh`

**Verificaciones:**
- ✅ Sistema operativo
- ✅ Instalación (directorio, repositorio git)
- ✅ Configuración (.env, variables, base de datos)
- ✅ Node.js y dependencias npm
- ✅ Servicios systemd (licencia-backend, nginx)
- ✅ Conectividad (localhost:3001, localhost:80)
- ✅ Firewall UFW (puertos abiertos)

**Menú interactivo (whiptail):**
1. Ver logs del backend (journalctl)
2. Ver logs de nginx
3. Reiniciar servicio backend
4. Reiniciar servicio nginx
5. Reinstalar dependencias npm
6. Reconstruir frontend
7. Reiniciar todo
8. Salir

### 4. `backup.sh` - Respaldos
**Uso:** `sudo bash /opt/licencia-admin/backup.sh`

**Qué hace:**
1. ✅ Crea directorio `/opt/licencia-backups/`
2. ✅ Respalda `licenses.db` con timestamp
3. ✅ Respalda `.env` con timestamp
4. ✅ Crea backup completo (tar.gz excluyendo node_modules, .git, dist)
5. ✅ Limpia backups antiguos (>7 días)
6. ✅ Opción para configurar cron (diario 2 AM)

---

## 🔗 Integración con AzerothCore

### Flujo de Validación Recomendado

```
[AzerothCore Module] 
    ↓
Obtener Hardware ID (MAC/hostname/UUID)
    ↓
POST /api/licenses/validate
Body: { "key": "ABCD-1234-...", "hardwareId": "AC-server01" }
    ↓
[Backend] Verifica:
  1. ¿Existe la licencia?
  2. ¿Está activa (no revoked/expired)?
  3. ¿La IP coincide con bound_ip? (si está seteado)
  4. ¿El hardwareId coincide con bound_hardware? (si está seteado)
  5. ¿No ha expirado?
    ↓
[Backend] Incrementa validation_count
    ↓
[AzerothCore] Recibe:
  - ✅ válido: Permite uso del módulo
  - ❌ inválido: Deshabilita funcionalidades, kickea jugadores, etc.
```

### Binding por Hardware (Recomendado para AzerothCore)

**Opción A: Usar MAC Address**
```cpp
#include <net/if.h>
#include <sys/ioctl.h>

std::string getMACAddress() {
    int fd = socket(AF_INET, SOCK_DGRAM, 0);
    struct ifreq ifr;
    strcpy(ifr.ifr_name, "eth0"); // o la interfaz principal
    ioctl(fd, SIOCGIFHWADDR, &ifr);
    close(fd);
    
    uint8_t* mac = (uint8_t*)ifr.ifr_hwaddr.sa_data;
    char macStr[18];
    sprintf(macStr, "%02X:%02X:%02X:%02X:%02X:%02X", 
            mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
    return std::string(macStr);
}
```

**Opción B: Usar combinación única**
```cpp
std::string generateHardwareId() {
    // Combina: hostname + MAC de primera interfaz no-loopback
    char hostname[256];
    gethostname(hostname, sizeof(hostname));
    return std::string("AC-") + hostname;
}
```

### Ejemplo de Módulo AzerothCore
Ver el archivo `INTEGRATION_PROMPT.md` para:
- ✅ Ejemplos completos en C++, Python, TypeScript
- ✅ Código listo para copiar/pegar
- ✅ Manejo de respuestas JSON
- ✅ Validación periódica con heartbeat

---

## 🔄 Flujos de Trabajo Principales

### 1. Crear Nueva Licencia
```
[Admin] Dashboard → "Crear Licencia"
    ↓
Llenar formulario (clave, tipo, propietario, etc.)
    ↓
[Opcional] Vincular IP: "192.168.1.100"
    ↓
[Opcional] Vincular Hardware ID: "AC-server01"
    ↓
Click "Guardar"
    ↓
[Backend] INSERT en tabla licenses
    ↓
[Frontend] Redirige a Dashboard
```

### 2. Validar Licencia (Desde Sistema Externo)
```
[Sistema Externo] Enviar POST /api/licenses/validate
    ↓
Body: { "key": "ABCD-1234-EFGH-5678", "hardwareId": "AC-server01" }
    ↓
[Backend] SELECT de licenses WHERE key = ?
    ↓
[Backend] Verificar: status, expiration, IP, hardware
    ↓
[Backend] UPDATE: validation_count++, last_validated_at = NOW()
    ↓
[Backend] INSERT en audit_logs
    ↓
[Sistema Externo] Recibe: { "valid": true, "license": { ... } }
```

### 3. Instalación en Producción
```
[Ubuntu 22.04] sudo bash install.sh
    ↓
[Interfaz whiptail] Bienvenida
    ↓
[Opción] ¿Configurar HTTPS? → Sí: Ingresar dominio + email
    ↓
[Progreso] Instalando dependencias, Node.js, clonando repo...
    ↓
[Generación] Contraseña admin: Ab3Cd5Ef7Gh9Ij1K
    ↓
[Servicios] Iniciando licencia-backend y nginx
    ↓
[Resumen] Muestra: URL, Usuario, Contraseña
    ↓
[Admin] Accede a http://IP o https://dominio
    ↓
[Login] Usuario: admin, Contraseña: (mostrada arriba)
```

---

## 📊 Estadísticas y Monitoreo

### Query de Estadísticas (Backend)
```javascript
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
    SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) as revoked,
    SUM(CASE WHEN type = 'software' THEN 1 ELSE 0 END) as software,
    SUM(CASE WHEN type = 'document' THEN 1 ELSE 0 END) as document,
    SUM(CASE WHEN type = 'service' THEN 1 ELSE 0 END) as service,
    SUM(CASE WHEN type = 'general' THEN 1 ELSE 0 END) as general,
    SUM(validation_count) as total_validations,
    AVG(validation_count) as avg_validations
FROM licenses
```

### Endpoint de Heartbeat
```bash
# Verificar que el servidor de licencias está vivo
curl http://tu-servidor/api/heartbeat

# Respuesta:
{"status": "OK", "timestamp": "2024-01-01T00:00:00.000Z"}
```

---

## ⚠️ Notas Importantes para el Futuro

### 🔴 CRÍTICO - No Cambiar sin Entender
1. **Base de datos SQLite:** No cambiar esquema sin migrar datos
2. **JWT_SECRET:** Si cambia, todos los tokens actuales se invalidan
3. **Admin por defecto:** Se crea solo si no existe en la tabla `users`
4. **IP Whitelist vacía:** Significa "permitir todas las IPs"

### 🟡 TENER EN CUENTA
1. **Respaldos:** Ejecutar `backup.sh` regularmente
2. **Actualizaciones:** Siempre usar `update.sh`, no `git pull` directo
3. **Logs:** Ver con `journalctl -u licencia-backend -f`
4. **Firewall:** UFW está habilitado, cuidado al agregar reglas

### 🟢 BUENAS PRÁCTICAS
1. **Contraseñas:** Usar el cambio desde la interfaz, no editar `.env` directamente
2. **Licencias:** Siempre vincular por hardware ID para producción
3. **Auditoría:** Revisar logs regularmente para detectar usos anómalos
4. **HTTPS:** En producción SIEMPRE usar HTTPS (instalador lo facilita)

---

## 🚀 Comandos de Referencia Rápida

### Gestión de Servicios
```bash
# Ver estado
systemctl status licencia-backend
systemctl status nginx

# Reiniciar
systemctl restart licencia-backend
systemctl restart nginx

# Ver logs en tiempo real
journalctl -u licencia-backend -f
tail -f /var/log/nginx/error.log
```

### Base de Datos (SQLite)
```bash
# Conectar a la DB
sqlite3 /opt/licencia-admin/backend/licenses.db

# Ver tablas
.tables

# Consultar licencias
SELECT id, key, type, status FROM licenses LIMIT 10;

# Ver usuarios
SELECT id, username, role FROM users;
```

### Git y Actualizaciones
```bash
# Ver estado del repositorio
cd /opt/licencia-admin
git status
git log --oneline -5

# Actualizar (usar script, no git pull directo)
sudo bash /opt/licencia-admin/update.sh

# Ver diferencias
git diff HEAD~1
```

---

## 📝 Checklist para Futuras Implementaciones

### Funcionalidades Sugeridas (No Implementadas)
- [ ] Roles más granulares (editor, viewer con restricciones)
- [ ] Notificaciones por email (licencia por expirar)
- [ ] API Keys adicionales para integración externa
- [ ] Dashboard con gráficos reales (Chart.js)
- [ ] Modo oscuro (dark mode) en frontend
- [ ] Soporte para múltiples idiomas
- [ ] API documentada con Swagger/OpenAPI
- [ ] Tests automatizados (Jest + Supertest)
- [ ] Dockerización completa (Dockerfile + docker-compose)
- [ ] Respaldos a la nube (S3, Google Drive)

### Mejoras de Seguridad
- [ ] 2FA (Two-Factor Authentication) para admin
- [ ] Cifrado de la base de datos SQLite
- [ ] Rate limiting más granular por IP/token
- [ ] Bloqueo temporal por intentos fallidos
- [ ] Headers de seguridad (Helmet.js)

---

## 📞 Contacto y Soporte

- **Repositorio:** https://github.com/kambire/licencia-admin
- **Issues:** https://github.com/kambire/licencia-admin/issues
- **Autor:** kambire (https://github.com/kambire)
- **Email de contacto:** kambire2007@gmail.com

---

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT**.

Ver el archivo `LICENSE` para detalles completos.

---

> **Última actualización de esta auditoría:** Abril 2026  
> **Versión del sistema:** 1.0.0  
> **Commit más reciente:** `75b7c8b` - Add beautiful modern README.md
