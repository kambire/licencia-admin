const db = require('../db/database');

const License = {
  getAll: (filters = {}) => {
    let query = 'SELECT * FROM licenses WHERE 1=1';
    const params = [];

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    query += ' ORDER BY createdAt DESC';
    return db.prepare(query).all(...params);
  },

  getById: (id) => {
    return db.prepare('SELECT * FROM licenses WHERE id = ?').get(id);
  },

  getByKey: (key) => {
    return db.prepare('SELECT * FROM licenses WHERE key = ?').get(key);
  },

  create: (data) => {
    const stmt = db.prepare(`
      INSERT INTO licenses (key, type, status, owner, description, metadata, createdAt, expiresAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    const result = stmt.run(
      data.key,
      data.type || 'general',
      data.status || 'active',
      data.owner || null,
      data.description || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      now,
      data.expiresAt || null,
      now
    );
    return License.getById(result.lastInsertRowid);
  },

  update: (id, data) => {
    const license = License.getById(id);
    if (!license) return null;

    const updates = [];
    const params = [];

    if (data.type !== undefined) { updates.push('type = ?'); params.push(data.type); }
    if (data.status !== undefined) { updates.push('status = ?'); params.push(data.status); }
    if (data.owner !== undefined) { updates.push('owner = ?'); params.push(data.owner); }
    if (data.description !== undefined) { updates.push('description = ?'); params.push(data.description); }
    if (data.metadata !== undefined) { updates.push('metadata = ?'); params.push(JSON.stringify(data.metadata)); }
    if (data.expiresAt !== undefined) { updates.push('expiresAt = ?'); params.push(data.expiresAt); }

    updates.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);

    db.prepare(`UPDATE licenses SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    return License.getById(id);
  },

  delete: (id) => {
    const result = db.prepare('DELETE FROM licenses WHERE id = ?').run(id);
    return result.changes > 0;
  },

  validate: (key) => {
    const license = License.getByKey(key);
    if (!license) return { valid: false, reason: 'License not found' };

    const now = new Date();
    if (license.status === 'revoked') return { valid: false, reason: 'License revoked' };
    if (license.status === 'expired') return { valid: false, reason: 'License expired' };

    if (license.expiresAt) {
      const expiry = new Date(license.expiresAt);
      if (expiry < now) {
        License.update(license.id, { status: 'expired' });
        return { valid: false, reason: 'License expired', expiredAt: license.expiresAt };
      }
    }

    return { valid: true, license: { ...license, metadata: license.metadata ? JSON.parse(license.metadata) : null } };
  }
};

module.exports = License;
