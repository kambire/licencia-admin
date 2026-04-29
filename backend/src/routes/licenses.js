const express = require('express');
const License = require('../models/License');
const { generateKey } = require('../utils/keyGenerator');
const { authMiddleware, login } = require('../middleware/auth');

const router = express.Router();

// Auth routes (no auth required)
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const result = login(username, password);
  if (result.success) {
    res.json({ token: result.token, user: { username, role: 'admin' } });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Protected routes
router.get('/', authMiddleware, (req, res) => {
  const filters = {};
  if (req.query.type) filters.type = req.query.type;
  if (req.query.status) filters.status = req.query.status;
  res.json(License.getAll(filters));
});

router.get('/generate-key', authMiddleware, (req, res) => {
  res.json({ key: generateKey() });
});

router.get('/:id', authMiddleware, (req, res) => {
  const license = License.getById(req.params.id);
  if (!license) return res.status(404).json({ error: 'License not found' });
  res.json(license);
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const { key, type, status, owner, description, metadata, expiresAt } = req.body;
    if (!key) return res.status(400).json({ error: 'Key is required' });
    const existing = License.getByKey(key);
    if (existing) return res.status(409).json({ error: 'License key already exists' });
    const license = License.create({ key, type, status, owner, description, metadata, expiresAt });
    res.status(201).json(license);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, (req, res) => {
  const license = License.update(req.params.id, req.body);
  if (!license) return res.status(404).json({ error: 'License not found' });
  res.json(license);
});

router.delete('/:id', authMiddleware, (req, res) => {
  const deleted = License.delete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'License not found' });
  res.json({ message: 'License deleted' });
});

router.post('/validate', authMiddleware, (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: 'Key is required' });
  res.json(License.validate(key));
});

module.exports = router;
