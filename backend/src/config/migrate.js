/**
 * Run once after setting up the database: `npm run migrate`
 * Creates all tables and seeds a first admin user.
 */
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { sequelize, User } = require('../models');

async function migrate() {
  await sequelize.sync({ alter: true });
  console.log('Tables created/updated.');

  const existingAdmin = await User.findOne({ where: { role: 'admin' } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('ChangeMe123!', 10);
    await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      passwordHash,
      role: 'admin',
    });
    console.log('Seeded admin user -> email: admin@example.com / password: ChangeMe123! (CHANGE THIS)');
  }
  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
