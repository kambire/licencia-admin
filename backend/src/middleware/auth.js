const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'licencia-admin-secret-key-2024';

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const login = (username, password) => {
  const user = User.validatePassword(username, password);
  if (user) {
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    return { success: true, token };
  }
  return { success: false };
};

module.exports = { authMiddleware, login, JWT_SECRET };
