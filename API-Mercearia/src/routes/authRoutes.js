const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config');
const { AppError } = require('../errors');

const router = express.Router();

router.post('/register', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!name || !email || !password) {
    throw new AppError(400, 'Nome, e-mail e senha são obrigatórios.');
  }
  if (password.length < 6) {
    throw new AppError(400, 'A senha deve ter pelo menos 6 caracteres.');
  }

  const exists = await User.findOne({ where: { email } });
  if (exists) throw new AppError(409, 'E-mail já cadastrado.');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash });

  return res.status(201).json({ id: user.id, name: user.name, email: user.email });
});

router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) {
    throw new AppError(400, 'E-mail e senha são obrigatórios.');
  }

  const user = await User.findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, 'Login inválido.');
  }

  const token = jwt.sign({ id: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: '8h',
  });

  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

module.exports = router;
