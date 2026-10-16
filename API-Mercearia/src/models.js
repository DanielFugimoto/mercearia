const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
});

const Product = sequelize.define('Product', {
  name: { type: DataTypes.STRING, allowNull: false },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 },
  },
  stockQty: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 },
  },
  minStockQty: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 },
  },
});

const Client = sequelize.define('Client', {
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING },
  address: { type: DataTypes.STRING },
  creditLimit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 },
  },
  debtBalance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 },
  },
});

const Sale = sequelize.define('Sale', {
  paymentType: { type: DataTypes.STRING, allowNull: false },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  dueDate: { type: DataTypes.DATEONLY, allowNull: true },
  outstandingAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  paidAt: { type: DataTypes.DATE, allowNull: true },
});

const SaleItem = sequelize.define('SaleItem', {
  qty: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 },
  },
});

User.hasMany(Sale, {
  foreignKey: { name: 'UserId', allowNull: false },
  onDelete: 'RESTRICT',
  as: 'sales',
});
Sale.belongsTo(User, { foreignKey: 'UserId', as: 'user' });

Client.hasMany(Sale, { foreignKey: 'ClientId', onDelete: 'RESTRICT', as: 'sales' });
Sale.belongsTo(Client, { foreignKey: 'ClientId', as: 'client' });

Sale.hasMany(SaleItem, {
  foreignKey: { name: 'SaleId', allowNull: false },
  onDelete: 'CASCADE',
  as: 'items',
});
SaleItem.belongsTo(Sale, { foreignKey: 'SaleId', as: 'sale' });

Product.hasMany(SaleItem, {
  foreignKey: { name: 'ProductId', allowNull: false },
  onDelete: 'RESTRICT',
  as: 'saleItems',
});
SaleItem.belongsTo(Product, { foreignKey: 'ProductId', as: 'product' });

module.exports = { sequelize, User, Product, Client, Sale, SaleItem };
