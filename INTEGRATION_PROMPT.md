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
3. [OTROS_REQUISITOS_ESPECÍFICOS]

Estructura de la petición:
```json
POST /api/licenses/validate
Content-Type: application/json

{
  "key": "XXXX-XXXX-XXXX-XXXX"
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
    "expiresAt": "2026-12-31T23:59:59.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

Respuesta fallida:
```json
{
  "valid": false,
  "reason": "License expired" | "License revoked" | "License not found"
}
```

Por favor, implementa:
1. Una función `validateLicense(key)` que haga la petición HTTP
2. Lógica para manejar el resultado y bloquear la app si la licencia no es válida
3. [INSTRUCCIONES_ADICIONALES]
```

---

## Ejemplo TypeScript/JavaScript

```typescript
const API_URL = 'http://localhost:3001/api/licenses/validate';

async function validateLicense(key: string): Promise<boolean> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: key.toUpperCase() })
    });
    const data = await response.json();
    if (data.valid) {
      console.log('Licencia válida:', data.license);
      return true;
    } else {
      console.error('Licencia inválida:', data.reason);
      return false;
    }
  } catch (error) {
    console.error('Error validando licencia:', error);
    return false;
  }
}

// Uso al iniciar la app
const myLicenseKey = 'ABCD-1234-EFGH-5678';
if (!(await validateLicense(myLicenseKey))) {
  alert('Licencia inválida. La aplicación se cerrará.');
  // Lógica para cerrar/bloquear la app
}
```

---

## Ejemplo Python

```python
import requests

API_URL = 'http://localhost:3001/api/licenses/validate'

def validate_license(key: str) -> bool:
    try:
        response = requests.post(API_URL, json={'key': key.upper()})
        data = response.json()
        if data.get('valid'):
            print(f"Licencia válida: {data['license']['type']}")
            return True
        else:
            print(f"Licencia inválida: {data.get('reason')}")
            return False
    except Exception as e:
        print(f"Error validando licencia: {e}")
        return False

if __name__ == '__main__':
    if not validate_license('ABCD-1234-EFGH-5678'):
        print("La aplicación no puede continuar sin una licencia válida.")
        exit(1)
```

---

## Notas Importantes

- La clave debe enviarse en mayúsculas (`key.toUpperCase()`)
- El sistema valida automáticamente si la licencia ha expirado
- Puedes cambiar `localhost:3001` por la IP de tu servidor Ubuntu
- Para producción, considera usar HTTPS y agregar autenticación al API
