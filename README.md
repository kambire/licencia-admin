# 🚀 Sistema de Administración de Licencias

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-green)
![Node](https://img.shields.io/badge/node-%3E18.x-brightgreen)
![React](https://img.shields.io/badge/react-18.2-blue)
![License](https://img.shields.io/badge/license-MIT-yellow)

**Sistema web completo para administrar licencias de software, documentos, servicios y otros productos.**

[Características](#-características) • [Instalación](#-instalación) • [Uso](#-uso) • [API](#-api-endpoints) • [Integración](#-integración-con-azerothcore)

</div>

---

## ✨ Características Principales

### 🔐 Seguridad Robusta
- **Autenticación JWT** con tokens de 24h
- **IP Whitelist** - Restricción de acceso por IP (soporta rangos CIDR)
- **Rate Limiting** - Protección contra abusos (login, validación, general)
- **Contraseñas encriptadas** con bcrypt
- **Logs de Auditoría** - Registro de todas las acciones

### 👥 Gestión de Usuarios
- **Múltiples usuarios** con roles (`admin` y `viewer`)
- **Cambio de contraseña** desde la interfaz
- **Usuario admin** generado automáticamente en la instalación

### 🔑 Gestión Avanzada de Licencias
- **CRUD completo** - Crear, leer, actualizar, eliminar
- **Tipos flexibles** - Software, Documento, Servicio, General
- **Binding por IP** - Vinculación a una IP específica
- **Binding por Hardware** - Vinculación a identificador de hardware (ideal para AzerothCore)
- **Contador de validaciones** - Estadísticas de uso por licencia
- **Filtros y búsqueda** - Por tipo, estado y texto
- **Paginación** - Manejo eficiente de muchas licencias
- **Exportación a CSV** - Backup de todas las licencias

### 📊 Estadísticas y Monitoreo
- **Dashboard** con métricas en tiempo real
- **Estadísticas por tipo** y estado
- **Gráficos de barras** visuales
- **Logs de auditoría** con IP y timestamp
- **Endpoint heartbeat** para verificación de disponibilidad

### 🛠️ Scripts de Producción (Ubuntu 22.04)
| Script | Descripción |
|-------|-------------|
| `install.sh` | Instalador moderno con interfaz whiptail, genera contraseña admin aleatoria, soporte HTTPS/Let's Encrypt |
| `update.sh` | Actualiza el sistema desde GitHub preservando la configuración (.env) |
| `check.sh` | Verifica el estado del sistema y permite reparar desde menú interactivo |
| `backup.sh` | Respalda la base de datos y configuración, limpia backups antiguos (7 días) |

---

## 🚀 Tech Stack

<div align="center">

### Backend
![Node.js](https://img.shields.io/badge/Node.js-18.x-brightgreen)
![Express](https://img.shields.io/badge/Express-4.18-lightgrey)
![SQLite](https://img.shields.io/badge/SQLite-3.x-blue)

### Frontend
![React](https://img.shields.io/badge/React-18.2-blue)
![Vite](https://img.shields.io/badge/Vite-5.0-yellow)

### Infraestructura
![Nginx](https://img.shields.io/badge/Nginx-1.18-green)
![Systemd](https://img.shields.io/badge/Systemd-249-orange)
![Ubuntu](https://img.shields.io/badge/Ubuntu-22.04-E95420)

</div>

---

## 📦 Instalación

### 🖥️ Desarrollo Local

#### Prerrequisitos
- Node.js 18+ instalado
- npm (incluido con Node.js)
- Git

#### 1. Clonar el repositorio
```bash
git clone https://github.com/kambire/licencia-admin.git
cd licencia-admin
```

#### 2. Configurar Backend
```bash
cd backend
npm install
# Crear archivo .env (opcional)
echo "PORT=3001" > .env
echo "ADMIN_USER=admin" >> .env
echo "ADMIN_PASS=tu_contraseña" >> .env
echo "JWT_SECRET=tu_secreto_jwt" >> .env
node src/index.js
```

#### 3. Configurar Frontend (nueva terminal)
```bash
cd frontend
npm install
npm run dev
```

#### 4. Acceder al sistema
Abre tu navegador en: **http://localhost:5173**

Credenciales por defecto (si no configuraste .env):
- Usuario: `admin`
- Contraseña: `admin` (cámbiala en producción)

---

### 🚀 Instalación en Ubuntu 22.04 (Producción)

#### Instalación Rápida
```bash
# Descargar el instalador
wget https://raw.githubusercontent.com/kambire/licencia-admin/main/install.sh

# O clonar el repositorio primero
git clone https://github.com/kambire/licencia-admin.git
cd licencia-admin

# Ejecutar instalador (requiere sudo)
sudo bash install.sh
```

#### Opciones del Instalador
1. **Interfaz moderna** con whiptail (GUI en terminal)
2. **Generación automática** de contraseña admin aleatoria (16 caracteres)
3. **Generación automática** de JWT_SECRET
4. **HTTPS opcional** con Let's Encrypt (necesitas dominio)
5. **Configuración automática** de firewall (UFW)
6. **Servicios systemd** para inicio automático

#### Acceso tras instalación
- **URL:** http://[IP-del-servidor]
- **Con HTTPS:** https://[tu-dominio]
- **API:** http://[IP-del-servidor]/api

---

## 💻 Scripts Disponibles

### `install.sh` - Instalador Completo
```bash
sudo bash install.sh
```
**Qué hace:**
- ✅ Instala Node.js 18, Nginx, dependencias
- ✅ Clona el repositorio en `/opt/licencia-admin`
- ✅ Configura backend y frontend
- ✅ Genera credenciales admin automáticamente
- ✅ Configura servicios systemd
- ✅ Configura Nginx como proxy inverso
- ✅ Configura firewall UFW
- ✅ Opción para HTTPS con Let's Encrypt

### `update.sh` - Actualización
```bash
sudo bash /opt/licencia-admin/update.sh
```
**Qué hace:**
- 🔄 Descarga últimos cambios de GitHub
- 🔄 Preserva el archivo `.env` (no sobreescribe)
- 🔄 Reinstala dependencias npm
- 🔄 Reconstruye el frontend
- 🔄 Reinicia servicios

### `check.sh` - Verificación y Reparación
```bash
sudo bash /opt/licencia-admin/check.sh
```
**Qué hace:**
- ✔️ Verifica archivos y directorios
- ✔️ Verifica Node.js y dependencias
- ✔️ Verifica servicios systemd (backend, nginx)
- ✔️ Verifica conectividad (API y frontend)
- ✔️ Verifica firewall
- 🔧 Menú interactivo para reparar problemas

### `backup.sh` - Respaldo
```bash
sudo bash /opt/licencia-admin/backup.sh
```
**Qué hace:**
- 💾 Respalda la base de datos SQLite
- 💾 Respalda el archivo `.env`
- 💾 Crea backup completo (sin node_modules)
- 🗑️ Limpia backups antiguos (+7 días)
- ⏰ Opción para configurar backup automático (cron diario)

---

## 🎮 Uso del Sistema

### Dashboard Principal
- Visualiza todas las licencias con filtros
- Búsqueda por clave, propietario o descripción
- Paginación para manejar grandes volúmenes
- Estadísticas rápidas de estado

### Gestión de Licencias
1. **Crear:** Click en "Crear Licencia" → Llenar formulario → Guardar
2. **Editar:** Click en "Editar" en cualquier licencia
3. **Eliminar:** Click en "Eliminar" (con confirmsación)
4. **Validar:** Ir a "Validar Licencia" → Ingresar clave → Ver resultado

### Configuración Avanzada de Licencias
- **Binding por IP:** Vincula la licencia a una IP específica (ej: `192.168.1.100` o rango `10.0.0.0/8`)
- **Binding por Hardware:** Vincula a un ID de hardware (para AzerothCore: usa MAC o huella digital)
- **Fecha de expiración:** Opcional, se marca como "expired" automáticamente

### Gestión de Usuarios (solo admin)
- Ir a "Usuarios" en el menú
- Crear nuevos usuarios con roles `admin` o `viewer`
- Cambiar contraseña propia desde "Cambiar Contraseña"

---

## 🔌 API Endpoints

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/licenses/login` | Obtener token JWT |

### Licencias
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/licenses` | Listar licencias (filtros: `type`, `status`, `search`, `limit`, `offset`) |
| POST | `/api/licenses` | Crear licencia |
| GET | `/api/licenses/:id` | Obtener licencia por ID |
| PUT | `/api/licenses/:id` | Actualizar licencia |
| DELETE | `/api/licenses/:id` | Eliminar licencia |
| POST | `/api/licenses/validate` | Validar clave (body: `key`, `hardwareId` opcional) |
| GET | `/api/licenses/statistics` | Obtener estadísticas (solo admin) |
| GET | `/api/licenses/export` | Exportar a CSV (solo admin) |
| GET | `/api/licenses/count` | Contar licencias (para paginación) |
| GET | `/api/licenses/generate-key` | Generar clave única |

### Usuarios (solo admin)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/users` | Listar usuarios |
| POST | `/api/users` | Crear usuario |
| PUT | `/api/users/:id` | Actualizar usuario |
| DELETE | `/api/users/:id` | Eliminar usuario |
| POST | `/api/users/change-password` | Cambiar contraseña propia |
| GET | `/api/users/audit-logs` | Obtener logs de auditoría |

### Sistema
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/health` | Verificar estado del backend |
| GET | `/api/heartbeat` | Heartbeat para verificación externa (sin auth) |

---

## 🎮 Integración con AzerothCore

### Opción 1: Usar C++ con libcurl (Recomendado)
Crea un módulo que valide la licencia al iniciar el servidor:

```cpp
#include <curl/curl.h>
#include <string>

bool validateLicense(const std::string& key, const std::string& hardwareId = "") {
    CURL* curl = curl_easy_init();
    if (!curl) return false;
    
    std::string postData = "{\"key\":\"" + key + "\"";
    if (!hardwareId.empty()) {
        postData += ",\"hardwareId\":\"" + hardwareId + "\"";
    }
    postData += "}";
    
    // Configurar CURL para POST...
    // Procesar respuesta JSON...
    
    curl_easy_cleanup(curl);
    return true; // o false según respuesta
}
```

### Opción 2: Usar el ejemplo de Python/Node.js
Ver el archivo `INTEGRATION_PROMPT.md` para ejemplos completos en:
- ✅ TypeScript/JavaScript
- ✅ Python
- ✅ C++ (AzerothCore)

### Binding para AzerothCore
En tu módulo de progresión, vincula la licencia al servidor:

**Opción A: Por IP del servidor**
```cpp
// En tu módulo AzerothCore
void OnStartup()
{
    std::string serverIP = "192.168.1.100"; // IP de tu servidor
    if (!validateLicense("ABCD-1234-EFGH-5678", ""))
    {
        // Licencia inválida - deshabilitar funcionalidades
        sLog->Error("Licencia inválida. Módulo deshabilitado.");
        return;
    }
    // Licencia válida - continuar
}
```

**Opción B: Por Hardware ID (Recomendado)**
```cpp
std::string generateHardwareId()
{
    // Combinación única: hostname + MAC + CPU info
    char hostname[256];
    gethostname(hostname, sizeof(hostname));
    return std::string("AC-") + hostname;
}

void OnStartup()
{
    std::string hardwareId = generateHardwareId();
    if (!validateLicense("ABCD-1234-EFGH-5678", hardwareId))
    {
        sLog->Error("Licencia inválida o hardware no autorizado.");
        return;
    }
}
```

### Validación Periódica (Heartbeat)
```cpp
void OnUpdate(uint32 diff)
{
    static uint32 checkTimer = 0;
    checkTimer += diff;
    
    if (checkTimer >= 6 * 60 * 60 * 1000) // Cada 6 horas
    {
        if (!checkHeartbeat())
        {
            sLog->Error("El servidor de licencias no responde.");
            // Opciones: deshabilitar módulo, kickear jugadores, etc.
        }
        checkTimer = 0;
    }
}
```

---

## ⚙️ Configuración Avanzada

### Variables de Entorno (`.env`)
```env
# Servidor
PORT=3001

# Admin (se genera automáticamente en la instalación)
ADMIN_USER=admin
ADMIN_PASS=contraseña_generada_automaticamente
JWT_SECRET=secreto_jwt_generado_automaticamente

# Seguridad (opcional)
ALLOWED_IPS=192.168.1.100,10.0.0.0/8,2001:db8::/32
```

### Configuración de IP Whitelist
Edita el archivo `backend/.env`:
```env
ALLOWED_IPS=127.0.0.1,192.168.1.0/24,2001:db8:1234::/48
```
- Dejar vacío para permitir todas las IPs
- Separar múltiples IPs/rangos con comas
- Soporta IPv4, IPv6 y rangos CIDR

---

## 📸 Capturas de Pantalla

<div align="center">

### Dashboard
*Visualización de licencias con filtros y paginación*

### Login
*Interfaz moderna con gradientes*

### Estadísticas
*Gráficos de barras con métricas*

### Verificación de Sistema (check.sh)
*Menú interactivo con whiptail*

</div>

---

## 🤝 Contribución

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Add nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

---

## 👤 Autor

**kambire**
- GitHub: [@kambire](https://github.com/kambire)
- Repositorio: [licencia-admin](https://github.com/kambire/licencia-admin)

---

## ⭐ Créditos y Agradecimientos

- **AzerothCore** - Por la inspiración para el sistema de licencias
- **Node.js & React** - Tecnologías principales
- **Let's Encrypt** - Certificados SSL gratuitos
- **whiptail** - Interfaz moderna en terminal

---

<div align="center">

**⭐ Si te gusta este proyecto, dale una estrella en GitHub! ⭐**

[Ir al repositorio](https://github.com/kambire/licencia-admin) • [Reportar Bug](https://github.com/kambire/licencia-admin/issues) • [Solicitar Feature](https://github.com/kambire/licencia-admin/issues)

</div>
