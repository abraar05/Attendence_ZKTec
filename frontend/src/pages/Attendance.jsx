import React, { useEffect, useState } from 'react';
import api from '../api/client';

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [importSummary, setImportSummary] = useState(null);

  function load() {
    api.get('/attendance', { params: { pageSize: 50 } }).then((r) => setRecords(r.data.records));
  }

  useEffect(() => {
    load();
    api.get('/devices').then((r) => setDevices(r.data));
  }, []);

  async function handleImport(e) {
    const files = e.target.files;
    if (!files.length) return;
    const form = new FormData();
    Array.from(files).forEach((f) => form.append('files', f));
    if (deviceId) form.append('deviceId', deviceId);
    const { data } = await api.post('/attendance/import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    setImportSummary(data);
    load();
  }

  return (
    <div>
      <h1>Attendance</h1>
      <div className="card">
        <p>Manual monthly export fallback — supports multiple CSV/Excel/.dat files at once.</p>
        <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
          <option value="">Select device (optional)</option>
          {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <input type="file" multiple accept=".csv,.txt,.dat,.xlsx,.xls" onChange={handleImport} style={{ marginLeft: 10 }} />
        {importSummary && (
          <p>Processed {importSummary.filesProcessed} file(s): {importSummary.recordsSaved} new record(s) saved
            {importSummary.errors?.length > 0 && `, ${importSummary.errors.length} error(s)`}.</p>
        )}
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Employee</th><th>Type</th><th>Time</th><th>Source</th></tr></thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{r.Employee?.name || `(unmatched: ${r.deviceUserId})`}</td>
                <td>{r.punchType}</td>
                <td>{new Date(r.timestamp).toLocaleString()}</td>
                <td>{r.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
