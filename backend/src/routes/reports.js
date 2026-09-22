const express = require('express');
const ExcelJS = require('exceljs');
const { requireAuth } = require('../middleware/auth');
const { getSummaryReport } = require('../services/reportService');

const router = express.Router();
router.use(requireAuth);

router.get('/summary', async (req, res) => {
  const { startDate, endDate, department } = req.query;
  if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate are required' });
  const report = await getSummaryReport({ startDate, endDate, department });
  res.json(report);
});

router.get('/summary/export', async (req, res) => {
  const { startDate, endDate, department } = req.query;
  const report = await getSummaryReport({ startDate, endDate, department });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Attendance Summary');
  sheet.columns = [
    { header: 'Emp Code', key: 'empCode', width: 12 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Department', key: 'department', width: 18 },
    { header: 'Days Present', key: 'daysPresent', width: 14 },
    { header: 'Working Days', key: 'totalWorkingDays', width: 14 },
    { header: 'Days Absent', key: 'daysAbsent', width: 12 },
    { header: 'Late Days', key: 'lateDays', width: 12 },
    { header: 'Total Hours', key: 'totalHours', width: 12 },
  ];
  sheet.addRows(report);
  sheet.getRow(1).font = { bold: true };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="attendance-summary-${startDate}-to-${endDate}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
});

module.exports = router;
