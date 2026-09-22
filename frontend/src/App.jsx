import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Employees from './pages/Employees.jsx';
import Attendance from './pages/Attendance.jsx';
import Reports from './pages/Reports.jsx';
import Devices from './pages/Devices.jsx';

export const isLoggedIn = () => Boolean(localStorage.getItem('token'));
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => error.response?.data?.error || error.message || fallback;
export const formatDate = (value, options) => value ? new Date(value).toLocaleString(undefined, options) : '—';
export const humanize = (value) => String(value || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function Protected({ children }) { return isLoggedIn() ? children : <Navigate to="/login" replace />; }

function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setMenuOpen(false), [location.pathname]);
  const links = [['/', 'Dashboard'], ['/employees', 'Employees'], ['/attendance', 'Attendance'], ['/reports', 'Reports'], ['/devices', 'Devices']];
  function logout() { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.hash = '#/login'; window.location.reload(); }
  return <div className="layout">
    <button className="menu-toggle" aria-label="Toggle navigation" onClick={() => setMenuOpen((open) => !open)}>☰</button>
    <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
      <div className="brand"><span className="brand-mark">A</span><div><strong>Attendly</strong><small>Operations console</small></div></div>
      <nav aria-label="Primary navigation">{links.map(([path, label]) => <NavLink key={path} to={path} end={path === '/'}>{label}</NavLink>)}</nav>
      <button className="logout-button" onClick={logout}>Sign out</button>
    </aside>
    <main className="main">{children}</main>
  </div>;
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return <header className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</header>;
}

export function Feedback({ loading, error, empty, children }) {
  if (loading) return <div className="feedback">Loading…</div>;
  if (error) return <div className="feedback error" role="alert">{error}</div>;
  if (empty) return <div className="feedback">{children || 'No records found.'}</div>;
  return null;
}

export function EmptyRow({ colSpan, children = 'No records found.' }) { return <tr><td colSpan={colSpan} className="empty-cell">{children}</td></tr>; }

export function saveSession(data) {
  localStorage.setItem('token', data.token);
  if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
}

export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
}

export function getToday() { return new Date().toISOString().slice(0, 10); }
export function getMonthStart() { return `${getToday().slice(0, 8)}01`; }
export function isValidDateRange(start, end) { return Boolean(start && end && start <= end); }
export function formatCount(value) { return new Intl.NumberFormat().format(Number(value) || 0); }
export function formatStatus(value) { return humanize(value); }
export function statusClass(value) { return `status-${String(value || 'unknown').toLowerCase()}`; }
export function safeArray(value) { return Array.isArray(value) ? value : []; }
export function isValidEmail(value) { return /\S+@\S+\.\S+/.test(value); }
export function canEdit(role) { return role === 'admin' || role === 'hr'; }
export function canManage(role) { return role === 'admin'; }
export function isReadOnly(role) { return role === 'viewer'; }
export function getUserRole() { return getStoredUser()?.role || 'viewer'; }
export function getUserName() { return getStoredUser()?.name || 'there'; }
export function initials(value = '') { return value.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'A'; }
export function toDateInput(value) { return value ? new Date(value).toISOString().slice(0, 10) : ''; }
export function formatDuration(value) { return value == null ? '—' : `${value}h`; }
export function formatPercent(value) { return `${Math.round(Number(value) || 0)}%`; }
export function display(value, fallback = '—') { return value || fallback; }
export function formatSource(value) { return humanize(value); }
export function formatPunchType(value) { return humanize(value); }
export function getApiUrl() { return import.meta.env.VITE_API_URL || '/api'; }
export function usePageTitle(title) { useEffect(() => { document.title = `${title} · Attendly`; }, [title]); }
export function clearSession() { localStorage.removeItem('token'); localStorage.removeItem('user'); }
export function getStoredToken() { return localStorage.getItem('token'); }
export function getUserInitials() { return initials(getUserName()); }
export function getSession() { return { token: getStoredToken(), user: getStoredUser() }; }
export function getRoleLabel(role) { return humanize(role); }
export function formatDateOnly(value) { return formatDate(value, { dateStyle: 'medium' }); }
export function formatTime(value) { return formatDate(value, { hour: '2-digit', minute: '2-digit' }); }
export function getMonthRange() { return { startDate: getMonthStart(), endDate: getToday() }; }
export function dateRangeLabel(start, end) { return `${start || '—'} to ${end || '—'}`; }

export default function App() {
  return <HashRouter><Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<Protected><Layout><Dashboard /></Layout></Protected>} />
    <Route path="/employees" element={<Protected><Layout><Employees /></Layout></Protected>} />
    <Route path="/attendance" element={<Protected><Layout><Attendance /></Layout></Protected>} />
    <Route path="/reports" element={<Protected><Layout><Reports /></Layout></Protected>} />
    <Route path="/devices" element={<Protected><Layout><Devices /></Layout></Protected>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></HashRouter>;
}

export { Layout };

// v1.1: responsive navigation, reusable page feedback, session helpers, and production-safe API defaults.
