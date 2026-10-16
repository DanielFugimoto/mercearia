const bcrypt = require('bcrypt');
const { sequelize, User, Product } = require('./models');
const ensureDatabaseSchema = require('./schema');

const products = [
  { name: 'Arroz 5kg', price: 24.9, stockQty: 30, minStockQty: 10 },
  { name: 'Feijão 1kg', price: 8.9, stockQty: 40, minStockQty: 12 },
  { name: 'Açúcar 1kg', price: 4.79, stockQty: 35, minStockQty: 10 },
  { name: 'Café 500g', price: 19.9, stockQty: 25, minStockQty: 8 },
  { name: 'Óleo de soja 900ml', price: 8.49, stockQty: 32, minStockQty: 10 },
  { name: 'Leite integral 1L', price: 5.49, stockQty: 48, minStockQty: 15 },
  { name: 'Macarrão espaguete 500g', price: 4.99, stockQty: 30, minStockQty: 10 },
  { name: 'Farinha de trigo 1kg', price: 6.29, stockQty: 20, minStockQty: 6 },
  { name: 'Sal refinado 1kg', price: 2.99, stockQty: 20, minStockQty: 5 },
  { name: 'Biscoito cream cracker 350g', price: 5.99, stockQty: 24, minStockQty: 8 },
  { name: 'Molho de tomate 300g', price: 2.79, stockQty: 36, minStockQty: 12 },
  { name: 'Refrigerante cola 2L', price: 9.99, stockQty: 18, minStockQty: 6 },
  { name: 'Detergente neutro 500ml', price: 2.69, stockQty: 24, minStockQty: 8 },
  { name: 'Sabão em pó 800g', price: 12.9, stockQty: 16, minStockQty: 5 },
  { name: 'Papel higiênico 4 rolos', price: 7.99, stockQty: 20, minStockQty: 6 },
];

function getSeedUser() {
  const name = String(process.env.SEED_USER_NAME || '').trim();
  const email = String(process.env.SEED_USER_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.SEED_USER_PASSWORD || '');

  if (!name || !email || !password) {
    throw new Error(
      'Configure SEED_USER_NAME, SEED_USER_EMAIL e SEED_USER_PASSWORD no arquivo .env.',
    );
  }

  if (password.length < 6) {
    throw new Error('SEED_USER_PASSWORD deve ter pelo menos 6 caracteres.');
  }

  return { name, email, password };
}

async function seed() {
  const seedUser = getSeedUser();
  await sequelize.authenticate();
  await ensureDatabaseSchema();

  const result = await sequelize.transaction(async (transaction) => {
    const passwordHash = await bcrypt.hash(seedUser.password, 10);
    const [, userCreated] = await User.findOrCreate({
      where: { email: seedUser.email },
      defaults: {
        name: seedUser.name,
        email: seedUser.email,
        passwordHash,
      },
      transaction,
    });

    let productsCreated = 0;
    let productsExisting = 0;

    for (const product of products) {
      const [, created] = await Product.findOrCreate({
        where: { name: product.name },
        defaults: product,
        transaction,
      });

      if (created) productsCreated += 1;
      else productsExisting += 1;
    }

    return { userCreated, productsCreated, productsExisting };
  });

  console.log('Seed concluído.');
  console.log(`Usuário: ${result.userCreated ? 'criado' : 'já existente'} (${seedUser.email})`);
  console.log(`Produtos criados: ${result.productsCreated}`);
  console.log(`Produtos já existentes: ${result.productsExisting}`);
}

seed()
  .catch((error) => {
    console.error(`Falha ao executar o seed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
