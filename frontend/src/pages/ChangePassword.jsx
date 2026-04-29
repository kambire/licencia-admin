import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { licenseApi } from '../services/api';

function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (form.newPassword !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (form.newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await licenseApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      setMessage('Contraseña actualizada exitosamente');
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'Error al cambiar contraseña');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <h1>Cambiar Contraseña</h1>

      {message && (
        <div style={{ background: '#e8f5e9', padding: 10, borderRadius: 4, marginBottom: 20 }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{ background: '#ffebee', padding: 10, borderRadius: 4, marginBottom: 20, color: '#c62828' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 15 }}>
          <label>Contraseña Actual:</label><br />
          <input 
            type="password" 
            value={form.currentPassword} 
            onChange={e => setForm({...form, currentPassword: e.target.value})}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <div style={{ marginBottom: 15 }}>
          <label>Nueva Contraseña:</label><br />
          <input 
            type="password" 
            value={form.newPassword} 
            onChange={e => setForm({...form, newPassword: e.target.value})}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label>Confirmar Contraseña:</label><br />
          <input 
            type="password" 
            value={form.confirmPassword} 
            onChange={e => setForm({...form, confirmPassword: e.target.value})}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: 12, 
            background: '#4caf50', 
            color: 'white', 
            border: 'none', 
            borderRadius: 4,
            fontSize: 16
          }}
        >
          {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
        </button>
      </form>
    </div>
  );
}

export default ChangePassword;
