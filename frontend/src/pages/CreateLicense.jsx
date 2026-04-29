import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { licenseApi } from '../services/api';

function CreateLicense() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    key: '', type: 'general', status: 'active', owner: '', description: '', expiresAt: '',
    bound_ip: '', bound_hardware: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      licenseApi.getById(id).then(data => {
        setForm({
          key: data.key,
          type: data.type,
          status: data.status,
          owner: data.owner || '',
          description: data.description || '',
          expiresAt: data.expiresAt ? data.expiresAt.split('T')[0] : '',
          bound_ip: data.bound_ip || '',
          bound_hardware: data.bound_hardware || ''
        });
      });
    }
  }, [id]);

  const handleGenerateKey = async () => {
    const key = await licenseApi.generateKey();
    setForm({...form, key});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.expiresAt) delete payload.expiresAt;
      if (!payload.bound_ip) delete payload.bound_ip;
      if (!payload.bound_hardware) delete payload.bound_hardware;
      
      if (id) {
        await licenseApi.update(id, payload);
      } else {
        await licenseApi.create(payload);
      }
      navigate('/');
    } catch (error) {
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>{id ? 'Editar Licencia' : 'Crear Nueva Licencia'}</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 500 }}>
        <div style={{ marginBottom: 15 }}>
          <label>Clave de Licencia:</label><br />
          <input type="text" value={form.key} onChange={e => setForm({...form, key: e.target.value.toUpperCase()})} required style={{ width: '70%', padding: 8 }} />
          <button type="button" onClick={handleGenerateKey} style={{ padding: 8, marginLeft: 5 }}>Generar</button>
        </div>
        <div style={{ marginBottom: 15 }}>
          <label>Tipo:</label><br />
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={{ width: '100%', padding: 8 }}>
            <option value="general">General</option>
            <option value="software">Software</option>
            <option value="document">Documento</option>
            <option value="service">Servicio</option>
          </select>
        </div>
        <div style={{ marginBottom: 15 }}>
          <label>Estado:</label><br />
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} style={{ width: '100%', padding: 8 }}>
            <option value="active">Activa</option>
            <option value="expired">Expirada</option>
            <option value="revoked">Revocada</option>
          </select>
        </div>
        <div style={{ marginBottom: 15 }}>
          <label>Propietario:</label><br />
          <input type="text" value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: 15 }}>
          <label>Descripción:</label><br />
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ width: '100%', padding: 8, minHeight: 80 }} />
        </div>
        <div style={{ marginBottom: 15 }}>
          <label>Fecha de Expiración:</label><br />
          <input type="date" value={form.expiresAt} onChange={e => setForm({...form, expiresAt: e.target.value})} style={{ width: '100%', padding: 8 }} />
        </div>
        
        <hr style={{ margin: '20px 0' }} />
        <h3 style={{ marginTop: 0 }}>Seguridad Avanzada</h3>
        
        <div style={{ marginBottom: 15 }}>
          <label>IP Vinculada (opcional):</label><br />
          <input 
            type="text" 
            value={form.bound_ip} 
            onChange={e => setForm({...form, bound_ip: e.target.value})}
            placeholder="Ej: 192.168.1.100 o 10.0.0.0/8"
            style={{ width: '100%', padding: 8 }}
          />
          <small style={{ color: '#666' }}>Dejar vacío para permitir cualquier IP. Soporta rangos CIDR.</small>
        </div>
        
        <div style={{ marginBottom: 15 }}>
          <label>Hardware ID Vinculado (opcional):</label><br />
          <input 
            type="text" 
            value={form.bound_hardware} 
            onChange={e => setForm({...form, bound_hardware: e.target.value})}
            placeholder="Identificador único del hardware"
            style={{ width: '100%', padding: 8 }}
          />
          <small style={{ color: '#666' }}>Vincula la licencia a un hardware específico (para AzerothCore: usar MAC o una huella digital)</small>
        </div>
        
        <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#4caf50', color: 'white', border: 'none', borderRadius: 4 }}>
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" onClick={() => navigate('/')} style={{ padding: '10px 20px', marginLeft: 10 }}>Cancelar</button>
      </form>
    </div>
  );
}

export default CreateLicense;
