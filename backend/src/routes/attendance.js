const express = require('express');
const multer = require('multer');
const { Op } = require('sequelize');
const { AttendanceLog, Employee, Device } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');
const { importAttendanceFiles } = require('../services/importService');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(requireAuth);

router.get('/', async (req, res) => {
  const { employeeId, deviceId, startDate, endDate, page = 1, pageSize = 50 } = req.query;
  const where = {};
  if (employeeId) where.employeeId = employeeId;
  if (deviceId) where.deviceId = deviceId;
  if (startDate && endDate) where.timestamp = { [Op.between]: [new Date(startDate), new Date(endDate)] };

  const { count, rows } = await AttendanceLog.findAndCountAll({
    where,
    include: [{ model: Employee, attributes: ['name', 'empCode', 'department'] }, { model: Device, attributes: ['name'] }],
    order: [['timestamp', 'DESC']],
    limit: Number(pageSize),
    offset: (Number(page) - 1) * Number(pageSize),
  });

  res.json({ total: count, page: Number(page), pageSize: Number(pageSize), records: rows });
});

// Multi-file manual import — the monthly-download fallback workflow.
// Accepts several CSV/Excel/.dat files from one or more devices in one request.
router.post('/import', requireRole('admin', 'hr'), upload.array('files', 20), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' });
  const { deviceId } = req.body;
  const filePaths = req.files.map((f) => f.path);
  const summary = await importAttendanceFiles(filePaths, deviceId ? Number(deviceId) : null);
  res.json(summary);
});

module.exports = router;
