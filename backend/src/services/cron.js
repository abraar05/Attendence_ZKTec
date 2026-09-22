const cron = require('node-cron');
const { Device } = require('../models');
const { pollDevice } = require('./zktecoService');

function startPollingFallback() {
  const minutes = parseInt(process.env.DEVICE_POLL_INTERVAL_MINUTES || '5', 10);
  const expression = `*/${minutes} * * * *`;

  cron.schedule(expression, async () => {
    const devices = await Device.findAll();
    for (const device of devices) {
      try {
        const result = await pollDevice(device);
        if (result.savedCount > 0) {
          console.log(`[cron] device ${device.name}: ${result.savedCount} new record(s)`);
        }
      } catch (err) {
        console.error(`[cron] poll failed for device ${device.name}:`, err.message);
      }
    }
  });

  console.log(`[cron] polling fallback scheduled every ${minutes} minute(s)`);
}

module.exports = { startPollingFallback };
