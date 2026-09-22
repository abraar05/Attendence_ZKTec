import React, { useEffect, useState } from 'react';
import api from '../api/client';

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [today, setToday] = useState([]);

  useEffect(() => {
    api.get('/devices').then((r) => setDevices(r.data));
    const todayStr = new Date().toISOString().slice(0, 10);
    api.get('/attendance', { params: { startDate: `${todayStr}T00:00:00`, endDate: `${todayStr}T23:59:59`, pageSize: 10 } })
      .then((r) => setToday(r.data.records));
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="card">
        <h3>Device Status</h3>
        <table>
          <thead><tr><th>Name</th><th>IP</th><th>Status</th><th>Last Sync</th></tr></thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>{d.ip}</td>
                <td className={d.status === 'online' ? 'status-online' : 'status-offline'}>{d.status}</td>
                <td>{d.lastSyncAt ? new Date(d.lastSyncAt).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h3>Latest Punches Today</h3>
        <table>
          <thead><tr><th>Employee</th><th>Type</th><th>Time</th><th>Source</th></tr></thead>
          <tbody>
            {today.map((r) => (
              <tr key={r.id}>
                <td>{r.Employee?.name || `(unmatched: ${r.deviceUserId})`}</td>
                <td>{r.punchType}</td>
                <td>{new Date(r.timestamp).toLocaleTimeString()}</td>
                <td>{r.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
