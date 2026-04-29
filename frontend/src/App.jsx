import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CreateLicense from './pages/CreateLicense';
import ValidateLicense from './pages/ValidateLicense';

function App() {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 1200, margin: '0 auto', padding: 20 }}>
      <nav style={{ marginBottom: 30, padding: 15, background: '#f5f5f5', borderRadius: 8 }}>
        <Link to="/" style={{ marginRight: 20, textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>Dashboard</Link>
        <Link to="/create" style={{ marginRight: 20, textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>Crear Licencia</Link>
        <Link to="/validate" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>Validar Licencia</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create" element={<CreateLicense />} />
        <Route path="/create/:id" element={<CreateLicense />} />
        <Route path="/validate" element={<ValidateLicense />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
