// Simple migration runner for production/CI environments where you don't
// want `sequelize.sync({ alter: true })` running on every boot.
// Usage: npm run migrate
require('dotenv').config();
const { sequelize } = require('../models');

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // creates tables that don't exist yet; does not alter existing ones
    console.log('Migration complete: schema is up to date.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
