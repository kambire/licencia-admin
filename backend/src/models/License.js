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
      INSERT INTO licenses (key, type, status, owner, description, metadata, bound_ip, bound_hardware, createdAt, expiresAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    const result = stmt.run(
      data.key,
      data.type || 'general',
      data.status || 'active',
      data.owner || null,
      data.description || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.bound_ip || null,
      data.bound_hardware || null,
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
    if (data.bound_ip !== undefined) { updates.push('bound_ip = ?'); params.push(data.bound_ip); }
    if (data.bound_hardware !== undefined) { updates.push('bound_hardware = ?'); params.push(data.bound_hardware); }

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

  validate: (key, ipAddress, hardwareId) => {
    const license = License.getByKey(key);
    if (!license) {
      AuditLog.log(null, 'VALIDATE_LICENSE', `Failed: key not found - ${key}`, ipAddress);
      return { valid: false, reason: 'License not found' };
    }

    const now = new Date();
    
    // Verificar binding por IP
    if (license.bound_ip && license.bound_ip !== ipAddress) {
      AuditLog.log(null, 'VALIDATE_LICENSE', `Failed: IP mismatch - ${key} (expected: ${license.bound_ip}, got: ${ipAddress})`, ipAddress);
      return { valid: false, reason: 'License bound to different IP', bound_to: license.bound_ip };
    }
    
    // Verificar binding por Hardware
    if (license.bound_hardware && license.bound_hardware !== hardwareId) {
      AuditLog.log(null, 'VALIDATE_LICENSE', `Failed: Hardware mismatch - ${key}`, ipAddress);
      return { valid: false, reason: 'License bound to different hardware', bound_to: license.bound_hardware };
    }

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

    // Incrementar contador de validaciones
    db.prepare('UPDATE licenses SET validation_count = validation_count + 1, last_validated_at = ? WHERE id = ?')
      .run(now.toISOString(), license.id);

    AuditLog.log(null, 'VALIDATE_LICENSE', `Success: ${key} (validation #${license.validation_count + 1})`, ipAddress);
    return { 
      valid: true, 
      license: { 
        ...license, 
        metadata: license.metadata ? JSON.parse(license.metadata) : null,
        validation_count: license.validation_count + 1
      } 
    };
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
        SUM(CASE WHEN type = 'general' THEN 1 ELSE 0 END) as general,
        SUM(validation_count) as total_validations,
        AVG(validation_count) as avg_validations
      FROM licenses
    `).get();
    
    return stats;
  }
};

module.exports = License;
