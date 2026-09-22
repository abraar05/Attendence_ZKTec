const app = require('./app');
const { sequelize } = require('./models');
const { startAllLiveListeners } = require('./services/zktecoService');
const { startPollingFallback } = require('./services/cron');

const PORT = process.env.PORT || 5000;

async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }
  await sequelize.authenticate();
  console.log('[db] connected');

  await sequelize.sync(); // use migrate.js + real migrations for production schema changes

  await startAllLiveListeners(); // live push connections to every registered device
  startPollingFallback(); // safety-net polling in case a push connection drops

  app.listen(PORT, () => console.log(`[server] listening on port ${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
