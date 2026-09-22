const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Device = sequelize.define('Device', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  model: { type: DataTypes.STRING, defaultValue: 'ZKTeco' }, // e.g. "40i" or "50i"
  ip: { type: DataTypes.STRING, allowNull: false },
  port: { type: DataTypes.INTEGER, defaultValue: 4370 },
  location: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('online', 'offline', 'unknown'), defaultValue: 'unknown' },
  lastSyncAt: { type: DataTypes.DATE },
}, {
  tableName: 'devices',
  timestamps: true,
});

module.exports = Device;
