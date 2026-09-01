import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Teams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [managers, setManagers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', manager_id: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const { data } = await api.get('/teams');
    setTeams(data.teams);
  };

  useEffect(() => {
    load();
    if (user.role === 'admin') {
      api.get('/users', { params: { role: 'manager' } }).then(({ data }) => setManagers(data.users));
    }
  }, [user.role]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/teams', {
        name: form.name,
        description: form.description || undefined,
        manager_id: form.manager_id || undefined
      });
      setForm({ name: '', description: '', manager_id: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create team.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Teams</h1>
          <p className="subtitle">Groups of people who work together and share tasks.</p>
        </div>
        {user.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : '+ New team'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="form-card" style={{ maxWidth: 480, marginBottom: 28 }}>
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={handleCreate}>
            <div className="field">
              <label htmlFor="name">Team name</label>
              <input id="name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea id="description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="manager">Manager</label>
              <select id="manager" value={form.manager_id} onChange={(e) => setForm((f) => ({ ...f, manager_id: e.target.value }))}>
                <option value="">Unassigned</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create team'}
            </button>
          </form>
        </div>
      )}

      {teams.length === 0 ? (
        <div className="empty-state">No teams to show yet.</div>
      ) : (
        <div className="list">
          {teams.map((t) => (
            <Link to={`/teams/${t.id}`} className="list-row" key={t.id}>
              <span className="title">{t.name}</span>
              <span className="meta">{t.manager ? `Managed by ${t.manager.name}` : 'No manager'}</span>
              <span className="meta">{t.members.length} member{t.members.length === 1 ? '' : 's'}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
