/**
 * ZKTeco device integration.
 *
 * Uses node-zklib to talk to devices over the standard ZKTeco TCP protocol
 * (port 4370) that the 40 and 50i series both support. Two sync modes:
 *
 *  1. LIVE PUSH  — device.getRealTimeLogs() opens a persistent socket and
 *     fires a callback the instant someone punches. This is the "live sync"
 *     the devices support since they're network-connected.
 *
 *  2. POLLING    — a scheduled fallback (every N minutes, see cron.js) that
 *     pulls the full attendance log via getAttendances(), in case a live
 *     connection drops or a device reboots and misses events.
 *
 * Both paths write through the same saveAttendanceRecord() so records never
 * get duplicated (unique index on deviceId+deviceUserId+timestamp).
 */
const ZKLib = require('node-zklib');
const { Device, Employee, AttendanceLog } = require('../models');

const activeConnections = new Map(); // deviceId -> ZKLib instance (for live listeners)

async function connectToDevice(device) {
  const zk = new ZKLib(device.ip, device.port || 4370, 10000, 4000);
  await zk.createSocket();
  return zk;
}

/**
 * Match a raw device punch to a known employee by deviceUserId.
 */
async function resolveEmployee(deviceUserId) {
  const employee = await Employee.findOne({ where: { deviceUserId: String(deviceUserId) } });
  return employee ? employee.id : null;
}

/**
 * Simple in/out inference: first punch of the day = check_in,
 * every subsequent punch flips the type. Good enough as a default;
 * can be replaced with per-shift logic later.
 */
async function inferPunchType(employeeId, deviceUserId, timestamp) {
  if (!employeeId) return 'unknown';
  const dayStart = new Date(timestamp);
  dayStart.setHours(0, 0, 0, 0);
  const countToday = await AttendanceLog.count({
    where: { employeeId, timestamp: { [require('sequelize').Op.gte]: dayStart } },
  });
  return countToday % 2 === 0 ? 'check_in' : 'check_out';
}

async function saveAttendanceRecord({ deviceId, deviceUserId, timestamp, verifyMode, source, raw }) {
  const employeeId = await resolveEmployee(deviceUserId);
  const punchType = await inferPunchType(employeeId, deviceUserId, timestamp);

  const [record, created] = await AttendanceLog.findOrCreate({
    where: { deviceId, deviceUserId: String(deviceUserId), timestamp },
    defaults: { employeeId, punchType, verifyMode, source, rawData: raw || {} },
  });
  return { record, created };
}

/**
 * Pull the full attendance buffer from a device (used for polling
 * and for initial backfill / catch-up after downtime).
 */
async function pollDevice(deviceRow) {
  const zk = await connectToDevice(deviceRow);
  try {
    const logs = await zk.getAttendances(); // { data: [ { userSn, deviceUserId, recordTime, ... } ] }
    let savedCount = 0;
    for (const log of logs.data || []) {
      const { created } = await saveAttendanceRecord({
        deviceId: deviceRow.id,
        deviceUserId: log.deviceUserId ?? log.userSn,
        timestamp: new Date(log.recordTime),
        verifyMode: log.verifyMode,
        source: 'poll',
        raw: log,
      });
      if (created) savedCount++;
    }
    await Device.update(
      { status: 'online', lastSyncAt: new Date() },
      { where: { id: deviceRow.id } }
    );
    return { deviceId: deviceRow.id, savedCount };
  } catch (err) {
    await Device.update({ status: 'offline' }, { where: { id: deviceRow.id } });
    throw err;
  } finally {
    await zk.disconnect();
  }
}

/**
 * Open a persistent live-push listener for a device. Call once per
 * device at server startup; reconnects are handled by the caller
 * re-invoking this after a disconnect event.
 */
async function startLiveListener(deviceRow) {
  if (activeConnections.has(deviceRow.id)) return; // already listening

  const zk = await connectToDevice(deviceRow);
  activeConnections.set(deviceRow.id, zk);

  await Device.update({ status: 'online' }, { where: { id: deviceRow.id } });

  zk.getRealTimeLogs(async (data) => {
    try {
      await saveAttendanceRecord({
        deviceId: deviceRow.id,
        deviceUserId: data.deviceUserId ?? data.userId,
        timestamp: new Date(data.recordTime || Date.now()),
        verifyMode: data.verifyMode,
        source: 'live_push',
        raw: data,
      });
      await Device.update({ lastSyncAt: new Date() }, { where: { id: deviceRow.id } });
    } catch (err) {
      console.error(`[zkteco] failed to save live punch from device ${deviceRow.id}:`, err.message);
    }
  });

  console.log(`[zkteco] live listener started for device "${deviceRow.name}" (${deviceRow.ip})`);
}

async function stopLiveListener(deviceId) {
  const zk = activeConnections.get(deviceId);
  if (zk) {
    await zk.disconnect();
    activeConnections.delete(deviceId);
  }
}

async function startAllLiveListeners() {
  const devices = await Device.findAll();
  for (const device of devices) {
    try {
      await startLiveListener(device);
    } catch (err) {
      console.error(`[zkteco] could not connect to device "${device.name}":`, err.message);
      await Device.update({ status: 'offline' }, { where: { id: device.id } });
    }
  }
}

module.exports = {
  pollDevice,
  startLiveListener,
  stopLiveListener,
  startAllLiveListeners,
  saveAttendanceRecord,
};
