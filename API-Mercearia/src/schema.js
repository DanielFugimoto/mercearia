const { DataTypes } = require('sequelize');
const { sequelize, Client, Sale } = require('./models');
const config = require('./config');
const { roundMoney } = require('./money');

function calculateDueDate(purchaseDate) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: config.timezone,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(purchaseDate);
  const year = Number(parts.find((part) => part.type === 'year').value);
  const month = Number(parts.find((part) => part.type === 'month').value);
  const dueYear = month === 12 ? year + 1 : year;
  const dueMonth = month === 12 ? 1 : month + 1;

  return `${dueYear}-${String(dueMonth).padStart(2, '0')}-10`;
}

async function addColumnIfMissing(tableName, columnName, definition) {
  const queryInterface = sequelize.getQueryInterface();
  const columns = await queryInterface.describeTable(tableName);

  if (!columns[columnName]) {
    await queryInterface.addColumn(tableName, columnName, definition);
  }
}

async function ensureDatabaseSchema() {
  await sequelize.sync();

  await addColumnIfMissing('Products', 'minStockQty', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });

  await addColumnIfMissing('Clients', 'address', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await addColumnIfMissing('Sales', 'dueDate', {
    type: DataTypes.DATEONLY,
    allowNull: true,
  });

  await addColumnIfMissing('Sales', 'outstandingAmount', {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  });

  await addColumnIfMissing('Sales', 'paidAt', {
    type: DataTypes.DATE,
    allowNull: true,
  });

  await sequelize.transaction(async (transaction) => {
    const clients = await Client.findAll({ transaction });

    for (const client of clients) {
      const creditSales = await Sale.findAll({
        where: { ClientId: client.id, paymentType: 'STORE_CREDIT' },
        order: [['createdAt', 'DESC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const knownOutstanding = creditSales
        .filter((sale) => sale.outstandingAmount !== null)
        .reduce((total, sale) => total + Number(sale.outstandingAmount), 0);
      let unallocatedDebt = roundMoney(Math.max(0, Number(client.debtBalance) - knownOutstanding));

      for (const sale of creditSales) {
        const changes = {};
        if (!sale.dueDate) changes.dueDate = calculateDueDate(sale.createdAt);
        if (sale.outstandingAmount === null) {
          changes.outstandingAmount = roundMoney(Math.min(Number(sale.total), unallocatedDebt));
          unallocatedDebt = roundMoney(unallocatedDebt - changes.outstandingAmount);
        }
        if (Object.keys(changes).length > 0) await sale.update(changes, { transaction });
      }
    }

    await Sale.update(
      { outstandingAmount: 0 },
      {
        where: { outstandingAmount: null },
        transaction,
      },
    );
  });
}

module.exports = ensureDatabaseSchema;
module.exports.calculateDueDate = calculateDueDate;
