const sequelize = require('../config/db');
const Device = require('./Device');
const Employee = require('./Employee');
const AttendanceLog = require('./AttendanceLog');
const User = require('./User');

// Associations
Device.hasMany(AttendanceLog, { foreignKey: 'deviceId' });
AttendanceLog.belongsTo(Device, { foreignKey: 'deviceId' });

Employee.hasMany(AttendanceLog, { foreignKey: 'employeeId' });
AttendanceLog.belongsTo(Employee, { foreignKey: 'employeeId' });

module.exports = { sequelize, Device, Employee, AttendanceLog, User };
