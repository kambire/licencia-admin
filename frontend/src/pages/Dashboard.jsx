import { useEffect, useState } from 'react';
import { licenseApi } from '../services/api';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [licenses, setLicenses] = useState([]);
  const [filters, setFilters] = useState({ type: '', status: '' });
  const [loading, setLoading] = useState(true);

  const fetchLicenses = async () => {
    setLoading(true);
    const data = await licenseApi.getAll(filters);
    setLicenses(data);
    setLoading(false);
  };

  useEffect(() => { fetchLicenses(); }, [filters.type, filters.status]);

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar esta licencia?')) {
      await licenseApi.delete(id);
      fetchLicenses();
    }
  };

  const getStatusColor = (status) => {
    if (status === 'active') return '#4caf50';
    if (status === 'expired') return '#f44336';
    if (status === 'revoked') return '#9e9e9e';
    return '#000';
  };

  return (
    <div>
      <h1>Dashboard de Licencias</h1>
      <div style={{ marginBottom: 20 }}>
        <select value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
          <option value="">Todos los tipos</option>
          <option value="software">Software</option>
          <option value="document">Documento</option>
          <option value="service">Servicio</option>
          <option value="general">General</option>
        </select>
        <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
          <option value="">Todos los estados</option>
          <option value="active">Activa</option>
          <option value="expired">Expirada</option>
          <option value="revoked">Revocada</option>
        </select>
      </div>
      {loading ? <p>Cargando...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: 10, border: '1px solid #ddd' }}>Clave</th>
              <th style={{ padding: 10, border: '1px solid #ddd' }}>Tipo</th>
              <th style={{ padding: 10, border: '1px solid #ddd' }}>Estado</th>
              <th style={{ padding: 10, border: '1px solid #ddd' }}>Propietario</th>
              <th style={{ padding: 10, border: '1px solid #ddd' }}>Expira</th>
              <th style={{ padding: 10, border: '1px solid #ddd' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {licenses.map(lic => (
              <tr key={lic.id}>
                <td style={{ padding: 10, border: '1px solid #ddd', fontFamily: 'monospace' }}>{lic.key}</td>
                <td style={{ padding: 10, border: '1px solid #ddd' }}>{lic.type}</td>
                <td style={{ padding: 10, border: '1px solid #ddd', color: getStatusColor(lic.status), fontWeight: 'bold' }}>{lic.status}</td>
                <td style={{ padding: 10, border: '1px solid #ddd' }}>{lic.owner || '-'}</td>
                <td style={{ padding: 10, border: '1px solid #ddd' }}>{lic.expiresAt ? new Date(lic.expiresAt).toLocaleDateString() : 'Nunca'}</td>
                <td style={{ padding: 10, border: '1px solid #ddd' }}>
                  <Link to={`/create/${lic.id}`} style={{ marginRight: 10 }}>Editar</Link>
                  <button onClick={() => handleDelete(lic.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Dashboard;
