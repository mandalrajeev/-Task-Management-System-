import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const { data } = await api.get('/users');
    setUsers(data.users);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/users', form);
      setForm({ name: '', email: '', password: '', role: 'user' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the account.');
    } finally {
      setSubmitting(false);
    }
  };

  const changeRole = async (id, role) => {
    await api.patch(`/users/${id}`, { role });
    load();
  };

  const toggleActive = async (id, isActive) => {
    if (isActive) {
      await api.delete(`/users/${id}`);
    } else {
      await api.patch(`/users/${id}`, { is_active: true });
    }
    load();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>People</h1>
          <p className="subtitle">Everyone in your organization, and the role each person holds.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ New account'}
        </button>
      </div>

      {showForm && (
        <div className="form-card" style={{ maxWidth: 460, marginBottom: 28 }}>
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={handleCreate}>
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="password">Temporary password</label>
              <input
                id="password"
                type="password"
                minLength={8}
                required
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="role">Role</label>
              <select id="role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                <option value="user">User</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create account'}
            </button>
          </form>
        </div>
      )}

      <table className="simple-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>{u.is_active ? 'Active' : 'Deactivated'}</td>
              <td>
                <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(u.id, u.is_active)}>
                  {u.is_active ? 'Deactivate' : 'Reactivate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
