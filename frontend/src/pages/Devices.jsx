import React, { useEffect, useState } from 'react';
import api from '../api/client';

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [form, setForm] = useState({ name: '', model: '40i', ip: '', port: 4370, location: '' });

  function load() {
    api.get('/devices').then((r) => setDevices(r.data));
  }
  useEffect(load, []);

  async function addDevice(e) {
    e.preventDefault();
    await api.post('/devices', form);
    setForm({ name: '', model: '40i', ip: '', port: 4370, location: '' });
    load();
  }

  async function syncNow(id) {
    await api.post(`/devices/${id}/sync-now`);
    load();
  }

  return (
    <div>
      <h1>Devices</h1>
      <form className="card" onSubmit={addDevice}>
        <h3>Add ZKTeco Device</h3>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <select value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}>
          <option value="40i">ZKTeco 40i</option>
          <option value="50i">ZKTeco 50i</option>
        </select>
        <input placeholder="IP address" value={form.ip} onChange={(e) => setForm({ ...form, ip: e.target.value })} required />
        <input placeholder="Port" type="number" value={form.port} onChange={(e) => setForm({ ...form, port: Number(e.target.value) })} />
        <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <button type="submit">Add Device</button>
      </form>
      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Model</th><th>IP:Port</th><th>Status</th><th>Last Sync</th><th></th></tr></thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td><td>{d.model}</td><td>{d.ip}:{d.port}</td>
                <td className={d.status === 'online' ? 'status-online' : 'status-offline'}>{d.status}</td>
                <td>{d.lastSyncAt ? new Date(d.lastSyncAt).toLocaleString() : '—'}</td>
                <td><button onClick={() => syncNow(d.id)}>Sync Now</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
