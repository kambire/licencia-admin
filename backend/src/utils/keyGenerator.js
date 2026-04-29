const crypto = require('crypto');

const generateKey = () => {
  const bytes = crypto.randomBytes(8);
  const segments = [];
  for (let i = 0; i < 4; i++) {
    segments.push(bytes.slice(i * 2, i * 2 + 2).toString('hex').toUpperCase());
  }
  return segments.join('-');
};

module.exports = { generateKey };
