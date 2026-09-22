const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AttendanceLog = sequelize.define('AttendanceLog', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  employeeId: { type: DataTypes.INTEGER, allowNull: true }, // nullable until matched
  deviceId: { type: DataTypes.INTEGER, allowNull: false },
  deviceUserId: { type: DataTypes.STRING, allowNull: false },
  timestamp: { type: DataTypes.DATE, allowNull: false },
  punchType: { type: DataTypes.ENUM('check_in', 'check_out', 'unknown'), defaultValue: 'unknown' },
  verifyMode: { type: DataTypes.STRING }, // fingerprint, face, card, etc.
  source: { type: DataTypes.ENUM('live_push', 'poll', 'manual_import'), defaultValue: 'poll' },
  rawData: { type: DataTypes.JSONB },
}, {
  tableName: 'attendance_logs',
  timestamps: true,
  indexes: [
    { fields: ['employeeId', 'timestamp'] },
    { fields: ['deviceId', 'timestamp'] },
    { unique: true, fields: ['deviceId', 'deviceUserId', 'timestamp'] }, // prevents duplicate punches
  ],
});

module.exports = AttendanceLog;
