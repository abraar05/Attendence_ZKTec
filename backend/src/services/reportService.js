const { Op } = require('sequelize');
const { Employee, AttendanceLog } = require('../models');

/**
 * Build a per-employee attendance summary for a date range:
 * days present, total hours, late count, absent count (vs. working days).
 */
async function getSummaryReport({ startDate, endDate, department }) {
  const where = { status: 'active' };
  if (department) where.department = department;
  const employees = await Employee.findAll({ where });

  const results = [];
  for (const emp of employees) {
    const logs = await AttendanceLog.findAll({
      where: {
        employeeId: emp.id,
        timestamp: { [Op.between]: [new Date(startDate), new Date(endDate)] },
      },
      order: [['timestamp', 'ASC']],
    });

    // Group punches by calendar day
    const byDay = {};
    for (const log of logs) {
      const day = log.timestamp.toISOString().slice(0, 10);
      byDay[day] = byDay[day] || [];
      byDay[day].push(log);
    }

    let totalMinutes = 0;
    let lateDays = 0;
    const daysPresent = Object.keys(byDay).length;

    for (const [day, dayLogs] of Object.entries(byDay)) {
      const checkIn = dayLogs.find((l) => l.punchType === 'check_in') || dayLogs[0];
      const checkOut = [...dayLogs].reverse().find((l) => l.punchType === 'check_out') || dayLogs[dayLogs.length - 1];

      if (checkIn && checkOut && checkOut.timestamp > checkIn.timestamp) {
        totalMinutes += (checkOut.timestamp - checkIn.timestamp) / 60000;
      }

      const [shiftH, shiftM] = (emp.shiftStart || '09:00:00').split(':').map(Number);
      const shiftStartToday = new Date(checkIn.timestamp);
      shiftStartToday.setHours(shiftH, shiftM, 0, 0);
      if (checkIn.timestamp > new Date(shiftStartToday.getTime() + 10 * 60000)) {
        lateDays++; // more than 10 min after shift start
      }
    }

    const totalWorkingDays = countWorkingDays(startDate, endDate);

    results.push({
      employeeId: emp.id,
      empCode: emp.empCode,
      name: emp.name,
      department: emp.department,
      daysPresent,
      totalWorkingDays,
      daysAbsent: Math.max(totalWorkingDays - daysPresent, 0),
      lateDays,
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
    });
  }

  return results;
}

function countWorkingDays(startDate, endDate) {
  let count = 0;
  const cur = new Date(startDate);
  const end = new Date(endDate);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++; // excludes Sat/Sun; adjust for your work week
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

module.exports = { getSummaryReport };
