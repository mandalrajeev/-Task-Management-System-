import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function TeamDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await api.get(`/teams/${id}`);
    setTeam(data.team);
  };

  useEffect(() => {
    load();
    if (user.role === 'admin') {
      api.get('/users').then(({ data }) => setAllUsers(data.users));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const addMember = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError('');
    try {
      await api.post(`/teams/${id}/members`, { user_id: selectedUser });
      setSelectedUser('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add member.');
    }
  };

  const removeMember = async (userId) => {
    await api.delete(`/teams/${id}/members/${userId}`);
    load();
  };

  if (!team) return <p>Loading team…</p>;

  const memberIds = new Set(team.members.map((m) => m.id));
  const addableUsers = allUsers.filter((u) => !memberIds.has(u.id));

  return (
    <div>
      <Link to="/teams" style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
        ← Back to teams
      </Link>

      <div className="page-header" style={{ marginTop: 12 }}>
        <div>
          <h1>{team.name}</h1>
          <p className="subtitle">{team.description || 'No description yet.'}</p>
        </div>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
        Managed by <strong style={{ color: 'var(--ink)' }}>{team.manager ? team.manager.name : 'nobody yet'}</strong>
      </p>

      {error && <div className="error-banner">{error}</div>}

      <h2 style={{ marginTop: 28 }}>Members</h2>
      <table className="simple-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            {user.role === 'admin' && <th></th>}
          </tr>
        </thead>
        <tbody>
          {team.members.map((m) => (
            <tr key={m.id}>
              <td>{m.name}</td>
              <td>{m.email}</td>
              <td style={{ textTransform: 'capitalize' }}>{m.role}</td>
              {user.role === 'admin' && (
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => removeMember(m.id)}>
                    Remove
                  </button>
                </td>
              )}
            </tr>
          ))}
          {team.members.length === 0 && (
            <tr>
              <td colSpan={4} style={{ color: 'var(--ink-soft)' }}>
                No members yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {user.role === 'admin' && (
        <form onSubmit={addMember} style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div className="field" style={{ marginBottom: 0, minWidth: 220 }}>
            <label htmlFor="add-member">Add a member</label>
            <select id="add-member" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
              <option value="">Choose a person…</option>
              {addableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" type="submit">
            Add
          </button>
        </form>
      )}
    </div>
  );
}
