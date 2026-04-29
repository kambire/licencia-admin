import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { licenseApi } from '../services/api';

function Users() {
  const [users, setUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', role: 'viewer' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await licenseApi.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    try {
      if (editingUser) {
        await licenseApi.updateUser(editingUser.id, form);
        setMessage('Usuario actualizado exitosamente');
      } else {
        await licenseApi.createUser(form);
        setMessage('Usuario creado exitosamente');
      }
      setForm({ username: '', password: '', role: 'viewer' });
      setShowCreate(false);
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      setMessage('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({ username: user.username, password: '', role: user.role });
    setShowCreate(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este usuario?')) {
      try {
        await licenseApi.deleteUser(id);
        loadUsers();
      } catch (error) {
        alert('Error: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleChangePassword = () => {
    navigate('/change-password');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Gestión de Usuarios</h1>
        <div>
          <button onClick={handleChangePassword} style={{ marginRight: 10, padding: '8px 16px' }}>
            Cambiar mi contraseña
          </button>
          <button 
            onClick={() => { setShowCreate(true); setEditingUser(null); setForm({ username: '', password: '', role: 'viewer' }); }}
            style={{ padding: '8px 16px', background: '#4caf50', color: 'white', border: 'none', borderRadius: 4 }}
          >
            Nuevo Usuario
          </button>
        </div>
      </div>

      {message && (
        <div style={{ background: '#e8f5e9', padding: 10, borderRadius: 4, marginBottom: 20 }}>
          {message}
        </div>
      )}

      {showCreate && (
        <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 8, marginBottom: 20 }}>
          <h3>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 15 }}>
              <label>Usuario:</label><br />
              <input 
                type="text" 
                value={form.username} 
                onChange={e => setForm({...form, username: e.target.value})}
                required
                disabled={editingUser}
                style={{ width: '100%', padding: 8 }}
              />
            </div>
            <div style={{ marginBottom: 15 }}>
              <label>Contraseña {editingUser && '(dejar vacío para mantener)'}:</label><br />
              <input 
                type="password" 
                value={form.password} 
                onChange={e => setForm({...form, password: e.target.value})}
                required={!editingUser}
                style={{ width: '100%', padding: 8 }}
              />
            </div>
            <div style={{ marginBottom: 15 }}>
              <label>Rol:</label><br />
              <select 
                value={form.role} 
                onChange={e => setForm({...form, role: e.target.value})}
                style={{ width: '100%', padding: 8 }}
              >
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" style={{ padding: '8px 16px', background: '#4caf50', color: 'white', border: 'none', borderRadius: 4 }}>
              {editingUser ? 'Actualizar' : 'Crear'}
            </button>
            <button 
              type="button" 
              onClick={() => { setShowCreate(false); setEditingUser(null); }}
              style={{ marginLeft: 10, padding: '8px 16px' }}
            >
              Cancelar
            </button>
          </form>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: 10, border: '1px solid #ddd' }}>Usuario</th>
            <th style={{ padding: 10, border: '1px solid #ddd' }}>Rol</th>
            <th style={{ padding: 10, border: '1px solid #ddd' }}>Creado</th>
            <th style={{ padding: 10, border: '1px solid #ddd' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td style={{ padding: 10, border: '1px solid #ddd' }}>{user.username}</td>
              <td style={{ padding: 10, border: '1px solid #ddd' }}>
                <span style={{ 
                  background: user.role === 'admin' ? '#f44336' : '#2196f3', 
                  color: 'white', 
                  padding: '4px 8px', 
                  borderRadius: 4 
                }}>
                  {user.role}
                </span>
              </td>
              <td style={{ padding: 10, border: '1px solid #ddd' }}>
                {new Date(user.createdAt).toLocaleString()}
              </td>
              <td style={{ padding: 10, border: '1px solid #ddd' }}>
                <button onClick={() => handleEdit(user)} style={{ marginRight: 10 }}>Editar</button>
                <button onClick={() => handleDelete(user.id)} style={{ color: 'red' }}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Users;
