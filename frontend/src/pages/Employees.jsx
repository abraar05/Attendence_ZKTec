import React, { useEffect, useState } from 'react';
import api from '../api/client';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [importSummary, setImportSummary] = useState(null);

  function load() {
    api.get('/employees', { params: { search } }).then((r) => setEmployees(r.data));
  }

  useEffect(load, [search]);

  async function handleImport(e) {
    const files = e.target.files;
    if (!files.length) return;
    const form = new FormData();
    Array.from(files).forEach((f) => form.append('files', f));
    const { data } = await api.post('/employees/import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    setImportSummary(data);
    load();
  }

  return (
    <div>
      <h1>Employees</h1>
      <div className="card">
        <input placeholder="Search by name or code..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div style={{ marginTop: 10 }}>
          <label>Bulk import (CSV/Excel, multiple files supported): </label>
          <input type="file" multiple accept=".csv,.xlsx,.xls" onChange={handleImport} />
        </div>
        {importSummary && (
          <p>Imported: {importSummary.filesProcessed} file(s), {importSummary.created} created, {importSummary.updated} updated.</p>
        )}
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Code</th><th>Name</th><th>Department</th><th>Designation</th><th>Status</th></tr></thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id}>
                <td>{e.empCode}</td>
                <td>{e.name}</td>
                <td>{e.department}</td>
                <td>{e.designation}</td>
                <td>{e.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
