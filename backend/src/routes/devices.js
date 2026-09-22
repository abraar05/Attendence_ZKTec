const express = require('express');
const { Device } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');
const { pollDevice, startLiveListener, stopLiveListener } = require('../services/zktecoService');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  res.json(await Device.findAll());
});

router.post('/', requireRole('admin'), async (req, res) => {
  const device = await Device.create(req.body);
  try {
    await startLiveListener(device);
  } catch (err) {
    console.error(`Could not start live listener for new device: ${err.message}`);
  }
  res.status(201).json(device);
});

router.put('/:id', requireRole('admin'), async (req, res) => {
  await Device.update(req.body, { where: { id: req.params.id } });
  res.json(await Device.findByPk(req.params.id));
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  await stopLiveListener(Number(req.params.id));
  await Device.destroy({ where: { id: req.params.id } });
  res.status(204).end();
});

// Manually trigger a pull (in addition to the live push + cron fallback)
router.post('/:id/sync-now', async (req, res) => {
  const device = await Device.findByPk(req.params.id);
  if (!device) return res.status(404).json({ error: 'Device not found' });
  try {
    const result = await pollDevice(device);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: `Could not reach device: ${err.message}` });
  }
});

module.exports = router;
