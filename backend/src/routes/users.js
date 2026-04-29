const express = require('express');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Get all users (admin only)
router.get('/', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(User.getAll());
});

// Create user (admin only)
router.post('/', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  try {
    const user = User.create({ username, password, role });
    AuditLog.log(req.user.id, 'CREATE_USER', `Created user: ${username}`, req.ip);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/:id', authMiddleware, (req, res) => {
  const userId = parseInt(req.params.id);
  
  // Only admin or self can update
  if (req.user.role !== 'admin' && req.user.id !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const { username, password, role } = req.body;
  const user = User.update(userId, { username, password, role });
  
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  AuditLog.log(req.user.id, 'UPDATE_USER', `Updated user ID: ${userId}`, req.ip);
  res.json(user);
});

// Delete user (admin only)
router.delete('/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const userId = parseInt(req.params.id);
  const success = User.delete(userId);
  
  if (!success) return res.status(400).json({ error: 'Cannot delete last admin or user not found' });
  
  AuditLog.log(req.user.id, 'DELETE_USER', `Deleted user ID: ${userId}`, req.ip);
  res.json({ message: 'User deleted' });
});

// Change password (self)
router.post('/change-password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  const user = User.getByUsername(req.user.username);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const bcrypt = require('bcryptjs');
  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  
  User.update(req.user.id, { password: newPassword });
  AuditLog.log(req.user.id, 'CHANGE_PASSWORD', 'Password changed', req.ip);
  
  res.json({ message: 'Password updated successfully' });
});

// Get audit logs (admin only)
router.get('/audit-logs', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(AuditLog.getAll(100));
});

module.exports = router;
