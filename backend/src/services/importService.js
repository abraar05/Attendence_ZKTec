/**
 * Fallback / bulk import for the manual monthly export workflow, and for
 * uploading employee master lists. Supports multiple file formats so
 * whatever the device software exports (CSV, Excel) or a manually
 * prepared file can be dropped in directly.
 */
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');
const { Employee, AttendanceLog, Device } = require('../models');

function readRowsFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.csv' || ext === '.txt' || ext === '.dat') {
    const raw = fs.readFileSync(filePath, 'utf8');
    // ZKTeco raw .dat exports are usually whitespace/tab-delimited rather
    // than comma-delimited; detect and normalize before parsing.
    const delimiter = raw.includes('\t') ? '\t' : (raw.includes(',') ? ',' : /\s+/);
    if (delimiter instanceof RegExp) {
      return raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.split(delimiter));
    }
    return parse(raw, { delimiter, skip_empty_lines: true, trim: true });
  }

  if (ext === '.xlsx' || ext === '.xls') {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { header: 1 });
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

/**
 * Import attendance punches from one or more uploaded files.
 * Expected columns (in order, header row optional and auto-skipped
 * if the first cell isn't numeric/ID-like): deviceUserId, timestamp, verifyMode
 */
async function importAttendanceFiles(filePaths, deviceId) {
  const summary = { filesProcessed: 0, recordsFound: 0, recordsSaved: 0, errors: [] };

  for (const filePath of filePaths) {
    summary.filesProcessed++;
    try {
      const rows = readRowsFromFile(filePath);
      for (const row of rows) {
        const [deviceUserId, timestampRaw, verifyMode] = row;
        if (!deviceUserId || !timestampRaw) continue;
        if (isNaN(Date.parse(timestampRaw)) && !/^\d+$/.test(String(deviceUserId))) continue; // skip header row

        summary.recordsFound++;
        const timestamp = new Date(timestampRaw);
        if (isNaN(timestamp.getTime())) continue;

        const employee = await Employee.findOne({ where: { deviceUserId: String(deviceUserId) } });

        const [, created] = await AttendanceLog.findOrCreate({
          where: { deviceId, deviceUserId: String(deviceUserId), timestamp },
          defaults: {
            employeeId: employee ? employee.id : null,
            verifyMode: verifyMode || 'unknown',
            source: 'manual_import',
            rawData: { row },
          },
        });
        if (created) summary.recordsSaved++;
      }
    } catch (err) {
      summary.errors.push({ file: path.basename(filePath), message: err.message });
    }
  }

  if (!summary.errors.length && deviceId) {
    await Device.update({ lastSyncAt: new Date() }, { where: { id: deviceId } });
  }
  return summary;
}

/**
 * Bulk import / update the employee master list from CSV or Excel.
 * Expected columns: empCode, deviceUserId, name, department, designation, email, phone
 */
async function importEmployeeFiles(filePaths) {
  const summary = { filesProcessed: 0, created: 0, updated: 0, errors: [] };

  for (const filePath of filePaths) {
    summary.filesProcessed++;
    try {
      const rows = readRowsFromFile(filePath);
      const [header, ...dataRows] = rows;
      const cols = header.map((h) => String(h).trim().toLowerCase());

      for (const row of dataRows) {
        const record = {};
        cols.forEach((col, i) => { record[col] = row[i]; });
        if (!record.empcode || !record.name) continue;

        const [, created] = await Employee.findOrCreate({
          where: { empCode: String(record.empcode) },
          defaults: {
            name: record.name,
            deviceUserId: record.deviceuserid ? String(record.deviceuserid) : null,
            department: record.department,
            designation: record.designation,
            email: record.email,
            phone: record.phone,
          },
        });
        created ? summary.created++ : summary.updated++;
      }
    } catch (err) {
      summary.errors.push({ file: path.basename(filePath), message: err.message });
    }
  }
  return summary;
}

module.exports = { importAttendanceFiles, importEmployeeFiles, readRowsFromFile };
