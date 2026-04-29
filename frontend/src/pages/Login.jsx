import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/licenses/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/');
      } else {
        setError(data.error || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error de conexión');
    }
    
    setLoading(false);
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{ 
        background: 'white', 
        padding: 40, 
        borderRadius: 8, 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: 400
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: 30, color: '#333' }}>
          Sistema de Licencias
        </h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 5, color: '#666' }}>
              Usuario
            </label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({...form, username: e.target.value})}
              required
              style={{ 
                width: '100%', 
                padding: 10, 
                border: '1px solid #ddd', 
                borderRadius: 4,
                fontSize: 14
              }}
              placeholder="admin"
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 5, color: '#666' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              required
              style={{ 
                width: '100%', 
                padding: 10, 
                border: '1px solid #ddd', 
                borderRadius: 4,
                fontSize: 14
              }}
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div style={{ 
              background: '#ffebee', 
              color: '#c62828', 
              padding: 10, 
              borderRadius: 4, 
              marginBottom: 20,
              fontSize: 14
            }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 12,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              fontSize: 16,
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
