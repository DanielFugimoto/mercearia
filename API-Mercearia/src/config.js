const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const requiredVariables = [
  'DB_NAME',
  'DB_USER',
  'DB_PASS',
  'DB_HOST',
  'DB_PORT',
  'JWT_SECRET',
  'PORT',
  'FRONTEND_URL',
];

const missingVariables = requiredVariables.filter((name) => !process.env[name]);

if (missingVariables.length > 0) {
  throw new Error(`Variáveis de ambiente ausentes: ${missingVariables.join(', ')}`);
}

const port = Number(process.env.PORT);
const databasePort = Number(process.env.DB_PORT);

if (!Number.isInteger(port) || !Number.isInteger(databasePort)) {
  throw new Error('PORT e DB_PORT devem ser números inteiros.');
}

module.exports = {
  port,
  jwtSecret: process.env.JWT_SECRET,
  frontendOrigins: process.env.FRONTEND_URL.split(',').map((origin) => origin.trim()),
  timezone: process.env.APP_TIMEZONE || 'America/Sao_Paulo',
  database: {
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: process.env.DB_HOST,
    port: databasePort,
  },
};
