import React, { useState } from 'react';
import api from '../api/client';

export default function Reports() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + '01';
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [report, setReport] = useState([]);

  async function runReport() {
    const { data } = await api.get('/reports/summary', { params: { startDate, endDate } });
    setReport(data);
  }

  async function exportExcel() {
    const res = await api.get('/reports/summary/export', { params: { startDate, endDate }, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-summary-${startDate}-to-${endDate}.xlsx`;
    link.click();
  }

  return (
    <div>
      <h1>Reports</h1>
      <div className="card">
        <label>From: </label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <label style={{ marginLeft: 10 }}>To: </label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button style={{ marginLeft: 10 }} onClick={runReport}>Run Report</button>
        <button style={{ marginLeft: 10 }} onClick={exportExcel}>Export Excel</button>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Code</th><th>Name</th><th>Dept</th><th>Present</th><th>Absent</th><th>Late</th><th>Total Hours</th></tr></thead>
          <tbody>
            {report.map((r) => (
              <tr key={r.employeeId}>
                <td>{r.empCode}</td><td>{r.name}</td><td>{r.department}</td>
                <td>{r.daysPresent}</td><td>{r.daysAbsent}</td><td>{r.lateDays}</td><td>{r.totalHours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
