const rateLimit = require('express-rate-limit');

// Límite general: 100 peticiones por 15 minutos
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Límite estricto para login: 5 intentos por 15 minutos
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many login attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Límite para validación de licencias: 30 por minuto
const validateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'Too many validation requests.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { generalLimiter, loginLimiter, validateLimiter };
