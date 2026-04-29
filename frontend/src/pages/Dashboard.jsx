import { useEffect, useState } from 'react';
import { licenseApi } from '../services/api';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [licenses, setLicenses] = useState([]);
  const [filters, setFilters] = useState({ type: '', status: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const fetchLicenses = async () => {
    setLoading(true);
    const offset = (currentPage - 1) * pageSize;
    const data = await licenseApi.getAll({ ...filters, limit: pageSize, offset });
    setLicenses(data);
    
    // Get total count for pagination
    const count = await licenseApi.count(filters);
    setTotalCount(count);
    setLoading(false);
  };

  useEffect(() => { fetchLicenses(); }, [filters.type, filters.status, filters.search, currentPage]);

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar esta licencia?')) {
      await licenseApi.delete(id);
      fetchLicenses();
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    // search is already bound via filters
  };

  const getStatusColor = (status) => {
    if (status === 'active') return '#4caf50';
    if (status === 'expired') return '#f44336';
    if (status === 'revoked') return '#9e9e9e';
    return '#000';
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <h1>Dashboard de Licencias</h1>
      
      <div style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, flex: 1 }}>
          <input 
            type="text" 
            placeholder="Buscar por clave, propietario o descripción..."
            value={filters.search}
            onChange={e => setFilters({...filters, search: e.target.value})}
            style={{ flex: 1, padding: 8 }}
          />
          <button type="submit" style={{ padding: '8px 16px' }}>Buscar</button>
        </form>
        
        <select 
          value={filters.type} 
          onChange={e => { setFilters({...filters, type: e.target.value}); setCurrentPage(1); }}
          style={{ padding: 8 }}
        >
          <option value="">Todos los tipos</option>
          <option value="software">Software</option>
          <option value="document">Documento</option>
          <option value="service">Servicio</option>
          <option value="general">General</option>
        </select>
        
        <select 
          value={filters.status} 
          onChange={e => { setFilters({...filters, status: e.target.value}); setCurrentPage(1); }}
          style={{ padding: 8 }}
        >
          <option value="">Todos los estados</option>
          <option value="active">Activa</option>
          <option value="expired">Expirada</option>
          <option value="revoked">Revocada</option>
        </select>
      </div>

      <div style={{ marginBottom: 10, color: '#666' }}>
        Mostrando {licenses.length} de {totalCount} licencias
      </div>

      {loading ? <p>Cargando...</p> : (
        <>
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

          {totalPages > 1 && (
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ padding: '8px 16px' }}
              >
                Anterior
              </button>
              <span style={{ padding: '8px 16px' }}>
                Página {currentPage} de {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: '8px 16px' }}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
