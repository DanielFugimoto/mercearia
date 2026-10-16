const express = require('express');
const { Op } = require('sequelize');
const auth = require('../auth');
const { sequelize, Product, Client, Sale, SaleItem } = require('../models');
const { AppError } = require('../errors');
const { calculateDueDate } = require('../schema');
const { roundMoney } = require('../money');

const router = express.Router();
const PAYMENT_TYPES = new Set(['CASH', 'PIX', 'DEBIT_CARD', 'CREDIT_CARD', 'STORE_CREDIT']);

const saleInclude = [
  { association: 'client', attributes: ['id', 'name'] },
  {
    association: 'items',
    include: [{ association: 'product', attributes: ['id', 'name'] }],
  },
];

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError(400, 'Adicione pelo menos um item à venda.');
  }

  const quantities = new Map();
  for (const item of items) {
    const productId = Number(item.productId);
    const qty = Number(item.qty);

    if (!Number.isInteger(productId) || productId <= 0) {
      throw new AppError(400, 'Produto inválido.');
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new AppError(400, 'A quantidade dos itens deve ser maior que zero.');
    }

    quantities.set(productId, (quantities.get(productId) || 0) + qty);
  }

  return [...quantities].map(([productId, qty]) => ({ productId, qty }));
}

router.use(auth);

router.get('/sales', async (req, res) => {
  const sales = await Sale.findAll({
    include: saleInclude,
    order: [['createdAt', 'DESC']],
  });
  res.json(sales);
});

router.get('/sales/:id', async (req, res) => {
  const sale = await Sale.findByPk(req.params.id, { include: saleInclude });
  if (!sale) throw new AppError(404, 'Venda não encontrada.');
  res.json(sale);
});

router.post('/sales', async (req, res) => {
  const paymentType = String(req.body.paymentType || '');
  const clientId = req.body.clientId ? Number(req.body.clientId) : null;
  const items = normalizeItems(req.body.items);

  if (!PAYMENT_TYPES.has(paymentType)) {
    throw new AppError(400, 'Forma de pagamento inválida.');
  }
  if (req.body.clientId && (!Number.isInteger(clientId) || clientId <= 0)) {
    throw new AppError(400, 'Cliente inválido.');
  }
  if (paymentType === 'STORE_CREDIT' && !clientId) {
    throw new AppError(400, 'Venda fiada exige um cliente.');
  }

  const saleId = await sequelize.transaction(async (transaction) => {
    let client = null;
    if (clientId) {
      client = await Client.findByPk(clientId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!client) throw new AppError(404, 'Cliente não encontrado.');
    }

    const products = await Product.findAll({
      where: { id: { [Op.in]: items.map((item) => item.productId) } },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const productsById = new Map(products.map((product) => [product.id, product]));

    let total = 0;
    for (const item of items) {
      const product = productsById.get(item.productId);
      if (!product) throw new AppError(404, 'Produto não encontrado.');
      if (product.stockQty < item.qty) {
        throw new AppError(409, `Estoque insuficiente para ${product.name}.`);
      }
      total = roundMoney(total + Number(product.price) * item.qty);
    }

    if (paymentType === 'STORE_CREDIT') {
      const newDebt = roundMoney(Number(client.debtBalance) + total);
      if (newDebt > Number(client.creditLimit)) {
        throw new AppError(409, 'A venda ultrapassa o limite de crédito do cliente.');
      }
    }

    const saleDate = new Date();
    const sale = await Sale.create(
      {
        UserId: req.user.id,
        ClientId: clientId,
        paymentType,
        total,
        dueDate: paymentType === 'STORE_CREDIT' ? calculateDueDate(saleDate) : null,
        outstandingAmount: paymentType === 'STORE_CREDIT' ? total : 0,
        createdAt: saleDate,
        updatedAt: saleDate,
      },
      { transaction },
    );

    for (const item of items) {
      const product = productsById.get(item.productId);
      await SaleItem.create(
        {
          SaleId: sale.id,
          ProductId: product.id,
          qty: item.qty,
          unitPrice: product.price,
        },
        { transaction },
      );
      await product.decrement('stockQty', { by: item.qty, transaction });
    }

    if (paymentType === 'STORE_CREDIT') {
      client.debtBalance = roundMoney(Number(client.debtBalance) + total);
      await client.save({ transaction });
    }

    return sale.id;
  });

  const sale = await Sale.findByPk(saleId, { include: saleInclude });
  res.status(201).json(sale);
});

router.post('/sales/:id/pay', async (req, res) => {
  const saleId = Number(req.params.id);
  if (!Number.isInteger(saleId) || saleId <= 0) {
    throw new AppError(400, 'Venda inválida.');
  }

  await sequelize.transaction(async (transaction) => {
    const saleReference = await Sale.findByPk(saleId, {
      attributes: ['ClientId'],
      transaction,
    });
    if (!saleReference) throw new AppError(404, 'Venda não encontrada.');

    const client = await Client.findByPk(saleReference.ClientId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!client) throw new AppError(404, 'Cliente não encontrado.');

    const sale = await Sale.findByPk(saleId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!sale) throw new AppError(404, 'Venda não encontrada.');
    if (sale.paymentType !== 'STORE_CREDIT') {
      throw new AppError(400, 'Esta venda não é uma conta fiada.');
    }

    const outstandingAmount = Number(sale.outstandingAmount);
    if (outstandingAmount <= 0 || sale.paidAt) {
      throw new AppError(409, 'Esta conta fiada já foi paga.');
    }

    sale.outstandingAmount = 0;
    sale.paidAt = new Date();
    client.debtBalance = roundMoney(Math.max(0, Number(client.debtBalance) - outstandingAmount));

    await sale.save({ transaction });
    await client.save({ transaction });
  });

  const sale = await Sale.findByPk(saleId, { include: saleInclude });
  res.json(sale);
});

module.exports = router;
