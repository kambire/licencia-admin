import { useState, useEffect } from 'react';
import { licenseApi } from '../services/api';

function Statistics() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadStatistics();
    loadAuditLogs();
  }, []);

  const loadStatistics = async () => {
    try {
      const data = await licenseApi.getStatistics();
      setStats(data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const data = await licenseApi.getAuditLogs();
      setLogs(data);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  if (!stats) return <div>Cargando estadísticas...</div>;

  return (
    <div>
      <h1>Estadísticas del Sistema</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30 }}>
        <div style={{ background: '#e3f2fd', padding: 20, borderRadius: 8 }}>
          <h3 style={{ margin: 0, color: '#1976d2' }}>Total Licencias</h3>
          <p style={{ fontSize: 32, margin: '10px 0', fontWeight: 'bold' }}>{stats.total}</p>
        </div>
        <div style={{ background: '#e8f5e9', padding: 20, borderRadius: 8 }}>
          <h3 style={{ margin: 0, color: '#388e3c' }}>Activas</h3>
          <p style={{ fontSize: 32, margin: '10px 0', fontWeight: 'bold' }}>{stats.active}</p>
        </div>
        <div style={{ background: '#ffebee', padding: 20, borderRadius: 8 }}>
          <h3 style={{ margin: 0, color: '#d32f2f' }}>Expiradas</h3>
          <p style={{ fontSize: 32, margin: '10px 0', fontWeight: 'bold' }}>{stats.expired}</p>
        </div>
        <div style={{ background: '#fafafa', padding: 20, borderRadius: 8 }}>
          <h3 style={{ margin: 0, color: '#616161' }}>Revocadas</h3>
          <p style={{ fontSize: 32, margin: '10px 0', fontWeight: 'bold' }}>{stats.revoked}</p>
        </div>
      </div>

      <h2>Por Tipo</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15, marginBottom: 30 }}>
        <div style={{ background: '#f3e5f5', padding: 15, borderRadius: 8 }}>
          <strong>Software:</strong> {stats.software}
        </div>
        <div style={{ background: '#e8eaf6', padding: 15, borderRadius: 8 }}>
          <strong>Documento:</strong> {stats.document}
        </div>
        <div style={{ background: '#e0f2f1', padding: 15, borderRadius: 8 }}>
          <strong>Servicio:</strong> {stats.service}
        </div>
        <div style={{ background: '#fce4ec', padding: 15, borderRadius: 8 }}>
          <strong>General:</strong> {stats.general}
        </div>
      </div>

      <h2>Logs de Auditoría (Últimos 50)</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: 10, border: '1px solid #ddd', textAlign: 'left' }}>Fecha</th>
            <th style={{ padding: 10, border: '1px solid #ddd', textAlign: 'left' }}>Usuario ID</th>
            <th style={{ padding: 10, border: '1px solid #ddd', textAlign: 'left' }}>Acción</th>
            <th style={{ padding: 10, border: '1px solid #ddd', textAlign: 'left' }}>Detalles</th>
            <th style={{ padding: 10, border: '1px solid #ddd', textAlign: 'left' }}>IP</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td style={{ padding: 10, border: '1px solid #ddd' }}>
                {new Date(log.timestamp).toLocaleString()}
              </td>
              <td style={{ padding: 10, border: '1px solid #ddd' }}>{log.userId || 'N/A'}</td>
              <td style={{ padding: 10, border: '1px solid #ddd' }}>
                <span style={{ 
                  background: log.action.includes('ERROR') ? '#ffebee' : '#e8f5e9',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: 12
                }}>
                  {log.action}
                </span>
              </td>
              <td style={{ padding: 10, border: '1px solid #ddd' }}>{log.details}</td>
              <td style={{ padding: 10, border: '1px solid #ddd' }}>{log.ipAddress || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Statistics;
