# Prompt de Integración - Sistema de Licencias

Este documento proporciona la plantilla de prompt para que la IA integre la validación de licencias en tus proyectos.

---

## Prompt para IA

```
Necesito integrar la validación de licencias en mi aplicación [NOMBRE_DE_TU_APP] escrita en [TECHNOLOGY_STACK].

El sistema de licencias está corriendo en [URL_DEL_SERVIDOR] (por defecto: http://localhost:3001).

Quiero implementar:
1. Una función para validar una clave de licencia contra el endpoint `POST /api/licenses/validate`
2. Verificar el estado de la licencia al iniciar la aplicación
3. Vincular la licencia a la IP del servidor o hardware (binding)
4. [OTROS_REQUISITOS_ESPECÍFICOS]

### Binding por IP:
Si la licencia tiene un campo `bound_ip`, solo esa IP puede usarla.
Envia la IP del cliente en el header `X-Forwarded-For` o usa la IP del servidor.

### Binding por Hardware:
Si la licencia tiene un campo `bound_hardware`, solo ese hardware puede usarla.
Genera un Hardware ID único (en AzerothCore usa: MAC address, CPU ID, o combinación única).

Estructura de la petición:
```json
POST /api/licenses/validate
Content-Type: application/json

{
  "key": "XXXX-XXXX-XXXX-XXXX",
  "hardwareId": "opcional-hardware-id"
}
```

Respuesta exitosa (licencia válida):
```json
{
  "valid": true,
  "license": {
    "id": 1,
    "key": "ABCD-1234-EFGH-5678",
    "type": "software",
    "status": "active",
    "owner": "Cliente XYZ",
    "description": "Licencia premium",
    "bound_ip": "192.168.1.100",
    "bound_hardware": null,
    "validation_count": 5,
    "expiresAt": "2026-12-31T23:59:59.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

Respuesta fallida:
```json
{
  "valid": false,
  "reason": "License expired" | "License revoked" | "License not found" | "License bound to different IP" | "License bound to different hardware",
  "bound_to": "192.168.1.100"
}
```

### Endpoint de Heartbeat (para verificación periódica):
```json
GET /api/heartbeat

Respuesta:
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Por favor, implementa:
1. Una función `validateLicense(key, hardwareId?)` que haga la petición HTTP
2. Lógica para manejar el resultado y bloquear la app si la licencia no es válida
3. Algoritmo para generar Hardware ID único
4. Verificación periódica (cada X horas) usando el endpoint heartbeat
5. [INSTRUCCIONES_ADICIONALES]
```

---

## Ejemplo TypeScript/JavaScript

```typescript
const API_URL = 'http://localhost:3001/api/licenses/validate';

interface ValidationResponse {
  valid: boolean;
  license?: any;
  reason?: string;
  bound_to?: string;
}

async function validateLicense(key: string, hardwareId?: string): Promise<boolean> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        key: key.toUpperCase(),
        hardwareId 
      })
    });
    const data: ValidationResponse = await response.json();
    if (data.valid) {
      console.log('Licencia válida:', data.license);
      return true;
    } else {
      console.error('Licencia inválida:', data.reason);
      if (data.bound_to) {
        console.error('Licencia vinculada a:', data.bound_to);
      }
      return false;
    }
  } catch (error) {
    console.error('Error validando licencia:', error);
    return false;
  }
}

// Generar Hardware ID (ejemplo simple)
function generateHardwareId(): string {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  // Usar MAC de la primera interfaz no-internal
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (!iface.internal && iface.mac) {
        return iface.mac.replace(/:/g, '-');
      }
    }
  }
  return 'unknown';
}

// Uso al iniciar la app
const myLicenseKey = 'ABCD-1234-EFGH-5678';
const hardwareId = generateHardwareId();

if (!(await validateLicense(myLicenseKey, hardwareId))) {
  alert('Licencia inválida. La aplicación se cerrará.');
  // Lógica para cerrar/bloquear la app
}

// Verificación periódica (cada 6 horas)
setInterval(async () => {
  if (!await validateLicense(myLicenseKey, hardwareId)) {
    console.error('Licencia inválida. Cerrando aplicación...');
    process.exit(1);
  }
}, 6 * 60 * 60 * 1000);
```

---

## Ejemplo Python

```python
import requests
import uuid

API_URL = 'http://localhost:3001/api/licenses/validate'

def generate_hardware_id():
    try:
        # Intentar usar MAC address
        import getmac
        mac = getmac.get_mac_address()
        if mac:
            return mac
    except:
        pass
    # Fallback: generar ID basado en hostname
    import socket
    return socket.gethostname() + '-' + str(uuid.getnode())

def validate_license(key: str, hardware_id: str = None) -> bool:
    try:
        payload = {'key': key.upper()}
        if hardware_id:
            payload['hardwareId'] = hardware_id
            
        response = requests.post(API_URL, json=payload)
        data = response.json()
        
        if data.get('valid'):
            print(f"Licencia válida: {data['license']['type']}")
            print(f"Validaciones: {data['license'].get('validation_count', 0)}")
            return True
        else:
            print(f"Licencia inválida: {data.get('reason')}")
            if 'bound_to' in data:
                print(f"Vinculada a: {data['bound_to']}")
            return False
    except Exception as e:
        print(f"Error validando licencia: {e}")
        return False

if __name__ == '__main__':
    hardware_id = generate_hardware_id()
    if not validate_license('ABCD-1234-EFGH-5678', hardware_id):
        print("La aplicación no puede continuar sin una licencia válida.")
        exit(1)
```

---

## Ejemplo para AzerothCore (C++ con libcurl)

```cpp
#include <string>
#include <curl/curl.h>

std::string generateHardwareId() {
    // En AzerothCore puedes usar:
    // - MAC address del servidor
    // - Una combinación de CPU info + hostname
    // - O generar un UUID único guardado en config
    
    // Ejemplo simple usando hostname:
    char hostname[256];
    gethostname(hostname, sizeof(hostname));
    return std::string("AC-") + hostname;
}

bool validateLicense(const std::string& key, const std::string& hardwareId = "") {
    CURL* curl = curl_easy_init();
    if (!curl) return false;
    
    std::string url = "http://tu-servidor:3001/api/licenses/validate";
    std::string postData = "{\"key\":\"" + key + "\"";
    if (!hardwareId.empty()) {
        postData += ",\"hardwareId\":\"" + hardwareId + "\"";
    }
    postData += "}";
    
    // Configurar petición...
    // Procesar respuesta JSON...
    
    curl_easy_cleanup(curl);
    return true; // o false según respuesta
}
```

---

## Notas Importantes

- La clave debe enviarse en mayúsculas (`key.toUpperCase()`)
- El sistema valida automáticamente si la licencia ha expirado
- **Binding por IP**: Si `bound_ip` está seteado en la licencia, solo esa IP puede validarla
- **Binding por Hardware**: Si `bound_hardware` está seteado, solo ese hardware ID puede validarla
- **Contador de validaciones**: Cada validación incrementa `validation_count` y actualiza `last_validated_at`
- Puedes cambiar `localhost:3001` por la IP de tu servidor Ubuntu
- Para producción, considera usar HTTPS y agregar autenticación al API
- El endpoint `/api/heartbeat` es útil para verificar que el servidor de licencias está vivo
- Las IPs permitidas se configuran en el archivo `.env` con la variable `ALLOWED_IPS` (separadas por comas, soporta CIDR)
