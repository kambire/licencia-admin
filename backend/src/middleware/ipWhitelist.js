const ipRangeCheck = require('ip-range-check');

// IPs permitidas (configurable via .env)
const getAllowedIPs = () => {
  const envIPs = process.env.ALLOWED_IPS || '';
  return envIPs.split(',').map(ip => ip.trim()).filter(ip => ip.length > 0);
};

const ipWhitelistMiddleware = (req, res, next) => {
  const allowedIPs = getAllowedIPs();
  
  // Si no hay IPs configuradas, permitir todas (comportamiento por defecto)
  if (allowedIPs.length === 0) {
    return next();
  }
  
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || '';
  const cleanIP = clientIP.replace(/^::ffff:/, ''); // Limpiar IPv4 mapeada en IPv6
  
  // Verificar si la IP está en la lista
  for (const allowed of allowedIPs) {
    if (allowed === cleanIP) return next();
    // Soporte para rangos CIDR básicos
    if (allowed.includes('/')) {
      try {
        if (ipRangeCheck(cleanIP, allowed)) return next();
      } catch (e) { /* ignorar errores de formato */ }
    }
  }
  
  // IP no autorizada
  console.warn(`IP no autorizada: ${cleanIP}`);
  return res.status(403).json({ error: 'IP not allowed' });
};

module.exports = ipWhitelistMiddleware;
