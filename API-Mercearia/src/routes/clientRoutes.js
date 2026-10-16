const express = require('express');
const { Op } = require('sequelize');
const auth = require('../auth');
const { sequelize, Client, Sale } = require('../models');
const { AppError } = require('../errors');
const { roundMoney } = require('../money');

const router = express.Router();

function clientPayload(body) {
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim() || null;
  const address = String(body.address || '').trim() || null;
  const creditLimit = Number(body.creditLimit ?? 0);

  if (!name) throw new AppError(400, 'Nome é obrigatório.');
  if (!Number.isFinite(creditLimit) || creditLimit < 0) {
    throw new AppError(400, 'Limite de crédito inválido.');
  }

  return { name, phone, address, creditLimit };
}

router.use(auth);

router.get('/clients', async (req, res) => {
  res.json(await Client.findAll({ order: [['name', 'ASC']] }));
});

router.get('/clients/:id', async (req, res) => {
  const client = await Client.findByPk(req.params.id);
  if (!client) throw new AppError(404, 'Cliente não encontrado.');
  res.json(client);
});

router.post('/clients', async (req, res) => {
  res.status(201).json(await Client.create(clientPayload(req.body)));
});

router.put('/clients/:id', async (req, res) => {
  const client = await Client.findByPk(req.params.id);
  if (!client) throw new AppError(404, 'Cliente não encontrado.');
  await client.update(clientPayload(req.body));
  res.json(client);
});

router.delete('/clients/:id', async (req, res) => {
  const client = await Client.findByPk(req.params.id);
  if (!client) throw new AppError(404, 'Cliente não encontrado.');
  await client.destroy();
  res.status(204).send();
});

router.post('/clients/:id/pay', async (req, res) => {
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError(400, 'Informe um valor de pagamento válido.');
  }

  const result = await sequelize.transaction(async (transaction) => {
    const current = await Client.findByPk(req.params.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!current) throw new AppError(404, 'Cliente não encontrado.');
    if (Number(current.debtBalance) <= 0) {
      throw new AppError(400, 'Cliente não possui dívida.');
    }

    const pendingSales = await Sale.findAll({
      where: {
        ClientId: current.id,
        paymentType: 'STORE_CREDIT',
        outstandingAmount: { [Op.gt]: 0 },
      },
      order: [['dueDate', 'ASC'], ['createdAt', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    let remainingPayment = roundMoney(Math.min(amount, Number(current.debtBalance)));
    let appliedAmount = 0;

    for (const sale of pendingSales) {
      if (remainingPayment <= 0) break;
      const outstandingAmount = Number(sale.outstandingAmount);
      const appliedToSale = Math.min(outstandingAmount, remainingPayment);

      sale.outstandingAmount = roundMoney(outstandingAmount - appliedToSale);
      if (Number(sale.outstandingAmount) === 0) sale.paidAt = new Date();
      await sale.save({ transaction });

      remainingPayment = roundMoney(remainingPayment - appliedToSale);
      appliedAmount = roundMoney(appliedAmount + appliedToSale);
    }

    if (appliedAmount <= 0) {
      throw new AppError(409, 'Não há contas fiadas pendentes para pagamento.');
    }

    current.debtBalance = roundMoney(Math.max(0, Number(current.debtBalance) - appliedAmount));
    await current.save({ transaction });
    return { client: current, appliedAmount };
  });

  res.json({
    message: 'Pagamento registrado.',
    amount: result.appliedAmount,
    debtBalance: result.client.debtBalance,
  });
});

module.exports = router;
