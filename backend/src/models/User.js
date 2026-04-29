const db = require('../db/database');
const bcrypt = require('bcryptjs');

const User = {
  getAll: () => {
    return db.prepare('SELECT id, username, role, createdAt FROM users').all();
  },

  getById: (id) => {
    return db.prepare('SELECT id, username, role, createdAt FROM users WHERE id = ?').get(id);
  },

  getByUsername: (username) => {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  },

  create: (data) => {
    const hashedPass = bcrypt.hashSync(data.password, 10);
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO users (username, password, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(data.username, hashedPass, data.role || 'viewer', now, now);
    return User.getById(result.lastInsertRowid);
  },

  update: (id, data) => {
    const user = User.getById(id);
    if (!user) return null;

    const updates = [];
    const params = [];

    if (data.username !== undefined) { updates.push('username = ?'); params.push(data.username); }
    if (data.password !== undefined) { updates.push('password = ?'); params.push(bcrypt.hashSync(data.password, 10)); }
    if (data.role !== undefined) { updates.push('role = ?'); params.push(data.role); }

    updates.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    return User.getById(id);
  },

  delete: (id) => {
    // Prevent deleting the last admin
    const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count;
    const user = User.getById(id);
    if (user && user.role === 'admin' && adminCount <= 1) {
      return false; // Cannot delete last admin
    }
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return result.changes > 0;
  },

  validatePassword: (username, password) => {
    const user = User.getByUsername(username);
    if (!user) return null;
    if (bcrypt.compareSync(password, user.password)) {
      return { id: user.id, username: user.username, role: user.role };
    }
    return null;
  }
};

module.exports = User;
