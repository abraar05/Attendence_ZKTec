import React, { useState } from 'react';
import api from '../api/client';
import { saveSession, getErrorMessage } from '../App.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return setError('Enter your email and password.');
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      saveSession(data);
      window.location.href = '/';
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Check your credentials.'));
    } finally { setLoading(false); }
  }

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit} className="card login-card">
        <div className="brand"><span className="brand-mark">A</span><div><strong>Attendly</strong><small>Attendance operations console</small></div></div>
        <h2>Welcome back</h2>
        <p className="page-description">Sign in to manage your workplace attendance.</p>
        {error && <p className="error-text" role="alert">{error}</p>}
        <div className="form-grid">
          <label>Email<input autoComplete="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Password<input autoComplete="current-password" placeholder="Your password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        </div>
        <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}
