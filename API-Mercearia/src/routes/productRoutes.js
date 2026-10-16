const express = require('express');
const auth = require('../auth');
const { Product } = require('../models');
const { AppError } = require('../errors');

const router = express.Router();

function productPayload(body) {
  const name = String(body.name || '').trim();
  const price = Number(body.price);
  const stockQty = Number(body.stockQty);
  const minStockQty = Number(body.minStockQty);

  if (!name) throw new AppError(400, 'Nome é obrigatório.');
  if (!Number.isFinite(price) || price < 0) throw new AppError(400, 'Preço inválido.');
  if (!Number.isInteger(stockQty) || stockQty < 0) throw new AppError(400, 'Estoque inválido.');
  if (!Number.isInteger(minStockQty) || minStockQty < 0) {
    throw new AppError(400, 'Estoque mínimo inválido.');
  }

  return { name, price, stockQty, minStockQty };
}

router.use(auth);

router.get('/products', async (req, res) => {
  res.json(await Product.findAll({ order: [['name', 'ASC']] }));
});

router.get('/products/:id', async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw new AppError(404, 'Produto não encontrado.');
  res.json(product);
});

router.post('/products', async (req, res) => {
  res.status(201).json(await Product.create(productPayload(req.body)));
});

router.put('/products/:id', async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw new AppError(404, 'Produto não encontrado.');
  await product.update(productPayload(req.body));
  res.json(product);
});

router.delete('/products/:id', async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw new AppError(404, 'Produto não encontrado.');
  await product.destroy();
  res.status(204).send();
});

module.exports = router;
