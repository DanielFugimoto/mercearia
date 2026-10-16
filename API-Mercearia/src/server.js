const express = require('express');
const cors = require('cors');
const config = require('./config');
const { sequelize } = require('./models');
const ensureDatabaseSchema = require('./schema');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const clientRoutes = require('./routes/clientRoutes');
const saleRoutes = require('./routes/saleRoutes');
const { AppError, notFoundHandler, errorHandler } = require('./errors');

const app = express();

app.use(cors({
  origin(origin, callback) {
    if (!origin || config.frontendOrigins.includes(origin)) return callback(null, true);
    return callback(new AppError(403, 'Origem não permitida pelo CORS.'));
  },
}));
app.use(express.json({ limit: '100kb' }));

app.get('/health', (req, res) => res.json({ ok: true }));
app.use(authRoutes);
app.use(clientRoutes);
app.use(productRoutes);
app.use(saleRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  await sequelize.authenticate();
  await ensureDatabaseSchema();

  const server = app.listen(config.port, () => {
    console.log(`API disponível em http://localhost:${config.port}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error(`Não foi possível iniciar a API: ${error.message}`);
  process.exit(1);
});

module.exports = app;
