const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Employee = sequelize.define('Employee', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  empCode: { type: DataTypes.STRING, allowNull: false, unique: true }, // company employee code
  deviceUserId: { type: DataTypes.STRING }, // ID as registered on the ZKTeco device(s)
  name: { type: DataTypes.STRING, allowNull: false },
  department: { type: DataTypes.STRING },
  designation: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  shiftStart: { type: DataTypes.TIME, defaultValue: '09:00:00' },
  shiftEnd: { type: DataTypes.TIME, defaultValue: '18:00:00' },
  status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
}, {
  tableName: 'employees',
  timestamps: true,
});

module.exports = Employee;
