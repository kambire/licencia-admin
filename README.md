# Sistema de Administración de Licencias

Sistema web completo para administrar licencias de software, documentos, servicios y otros productos.

## Características

-   **CRUD Completo**: Crear, leer, actualizar y eliminar licencias
-   **Tipos Flexibles**: Software, Documentos, Servicios o General
-   **Validación**: Endpoint para verificar validez de licencias
-   **Generación de Claves**: Claves únicas `XXXX-XXXX-XXXX-XXXX`
-   **Filtros**: Búsqueda por tipo y estado
-   **Instalador**: Script para Ubuntu 22.04

## Tecnologías

-   **Backend**: Node.js + Express + SQLite
-   **Frontend**: React + Vite
-   **Despliegue**: Nginx + Systemd (Ubuntu 22.04)

## Instalación Rápida (Ubuntu 22.04)

```bash
sudo bash install-ubuntu22.sh
```

## Desarrollo Local

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Accede a `http://localhost:5173`

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/licenses` | Listar licencias |
| POST | `/api/licenses` | Crear licencia |
| GET | `/api/licenses/:id` | Obtener licencia |
| PUT | `/api/licenses/:id` | Actualizar licencia |
| DELETE | `/api/licenses/:id` | Eliminar licencia |
| POST | `/api/licenses/validate` | Validar clave |
| GET | `/api/licenses/generate-key` | Generar clave |

## Integración

Consulta `INTEGRATION_PROMPT.md` para integrar la validación en tus proyectos.

## Repositorio

https://github.com/kambire/licencia-admin
