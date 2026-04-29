import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CreateLicense from './pages/CreateLicense';
import ValidateLicense from './pages/ValidateLicense';
import Login from './pages/Login';
import { useEffect, useState } from 'react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
    };
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 1200, margin: '0 auto', padding: 20 }}>
      <nav style={{ marginBottom: 30, padding: 15, background: '#f5f5f5', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link to="/" style={{ marginRight: 20, textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>Dashboard</Link>
          <Link to="/create" style={{ marginRight: 20, textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>Crear Licencia</Link>
          <Link to="/validate" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>Validar Licencia</Link>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#f44336', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Cerrar Sesión
        </button>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create" element={<CreateLicense />} />
        <Route path="/create/:id" element={<CreateLicense />} />
        <Route path="/validate" element={<ValidateLicense />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
