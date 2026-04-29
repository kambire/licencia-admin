import { useState } from 'react';
import { licenseApi } from '../services/api';

function ValidateLicense() {
  const [key, setKey] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleValidate = async () => {
    if (!key) return;
    setLoading(true);
    const data = await licenseApi.validate(key);
    setResult(data);
    setLoading(false);
  };

  return (
    <div>
      <h1>Validar Licencia</h1>
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          value={key}
          onChange={e => setKey(e.target.value.toUpperCase())}
          placeholder="Ingresa la clave (XXXX-XXXX-XXXX-XXXX)"
          style={{ padding: 10, width: 400, fontSize: 16, fontFamily: 'monospace' }}
        />
        <button onClick={handleValidate} disabled={loading} style={{ padding: '10px 20px', marginLeft: 10, fontSize: 16 }}>
          {loading ? 'Validando...' : 'Validar'}
        </button>
      </div>
      {result && (
        <div style={{
          padding: 20,
          borderRadius: 8,
          background: result.valid ? '#e8f5e9' : '#ffebee',
          border: `2px solid ${result.valid ? '#4caf50' : '#f44336'}`
        }}>
          <h3 style={{ color: result.valid ? '#2e7d32' : '#c62828' }}>
            {result.valid ? 'Licencia Válida' : 'Licencia Inválida'}
          </h3>
          {result.valid ? (
            <div>
              <p><strong>Clave:</strong> {result.license.key}</p>
              <p><strong>Tipo:</strong> {result.license.type}</p>
              <p><strong>Estado:</strong> {result.license.status}</p>
              <p><strong>Propietario:</strong> {result.license.owner || 'N/A'}</p>
              <p><strong>Creada:</strong> {new Date(result.license.createdAt).toLocaleString()}</p>
              {result.license.expiresAt && <p><strong>Expira:</strong> {new Date(result.license.expiresAt).toLocaleString()}</p>}
            </div>
          ) : (
            <p><strong>Razón:</strong> {result.reason}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default ValidateLicense;
