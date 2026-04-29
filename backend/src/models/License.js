const db = require('../db/database');
const AuditLog = require('./AuditLog');

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
    if (filters.search) {
      query += ' AND (key LIKE ? OR owner LIKE ? OR description LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    query += ' ORDER BY createdAt DESC';
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }
    
    return db.prepare(query).all(...params);
  },

  count: (filters = {}) => {
    let query = 'SELECT COUNT(*) as count FROM licenses WHERE 1=1';
    const params = [];

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.search) {
      query += ' AND (key LIKE ? OR owner LIKE ? OR description LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    return db.prepare(query).get(...params).count;
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

  validate: (key, ipAddress) => {
    const license = License.getByKey(key);
    if (!license) {
      AuditLog.log(null, 'VALIDATE_LICENSE', `Failed: key not found - ${key}`, ipAddress);
      return { valid: false, reason: 'License not found' };
    }

    const now = new Date();
    if (license.status === 'revoked') {
      AuditLog.log(null, 'VALIDATE_LICENSE', `Failed: revoked - ${key}`, ipAddress);
      return { valid: false, reason: 'License revoked' };
    }
    if (license.status === 'expired') {
      AuditLog.log(null, 'VALIDATE_LICENSE', `Failed: expired - ${key}`, ipAddress);
      return { valid: false, reason: 'License expired' };
    }

    if (license.expiresAt) {
      const expiry = new Date(license.expiresAt);
      if (expiry < now) {
        License.update(license.id, { status: 'expired' });
        AuditLog.log(null, 'VALIDATE_LICENSE', `Failed: expired (auto) - ${key}`, ipAddress);
        return { valid: false, reason: 'License expired', expiredAt: license.expiresAt };
      }
    }

    AuditLog.log(null, 'VALIDATE_LICENSE', `Success: ${key}`, ipAddress);
    return { valid: true, license: { ...license, metadata: license.metadata ? JSON.parse(license.metadata) : null } };
  },

  getStatistics: () => {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) as revoked,
        SUM(CASE WHEN type = 'software' THEN 1 ELSE 0 END) as software,
        SUM(CASE WHEN type = 'document' THEN 1 ELSE 0 END) as document,
        SUM(CASE WHEN type = 'service' THEN 1 ELSE 0 END) as service,
        SUM(CASE WHEN type = 'general' THEN 1 ELSE 0 END) as general
      FROM licenses
    `).get();
    
    return stats;
  }
};

module.exports = License;
