const express = require('express');
const License = require('../models/License');
const { generateKey } = require('../utils/keyGenerator');
const { authMiddleware, login, JWT_SECRET } = require('../middleware/auth');
const { loginLimiter, validateLimiter, generalLimiter } = require('../middleware/rateLimit');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Apply general rate limiting to all routes
router.use(generalLimiter);

// Auth routes (no auth required)
router.post('/login', loginLimiter, (req, res) => {
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
  if (req.query.search) filters.search = req.query.search;
  if (req.query.limit) filters.limit = parseInt(req.query.limit);
  if (req.query.offset) filters.offset = parseInt(req.query.offset);
  res.json(License.getAll(filters));
});

router.get('/count', authMiddleware, (req, res) => {
  const filters = {};
  if (req.query.type) filters.type = req.query.type;
  if (req.query.status) filters.status = req.query.status;
  if (req.query.search) filters.search = req.query.search;
  res.json({ count: License.count(filters) });
});

router.get('/statistics', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(License.getStatistics());
});

router.get('/export', authMiddleware, (req, res) => {
  const licenses = License.getAll();
  
  let csv = 'ID,Key,Type,Status,Owner,Description,ExpiresAt,CreatedAt\n';
  licenses.forEach(lic => {
    csv += `${lic.id},"${lic.key}","${lic.type}","${lic.status}","${lic.owner || ''}","${lic.description || ''}","${lic.expiresAt || ''}","${lic.createdAt}"\n`;
  });
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="licenses.csv"');
  res.send(csv);
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

router.post('/validate', validateLimiter, (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: 'Key is required' });
  res.json(License.validate(key, req.ip));
});

module.exports = router;
