const jwt = require('jsonwebtoken');
const config = require('./config');

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Autenticação necessária.' });
  }

  try {
    req.user = jwt.verify(header.slice(7), config.jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ message: 'Sessão inválida ou expirada.' });
  }
}

module.exports = auth;

