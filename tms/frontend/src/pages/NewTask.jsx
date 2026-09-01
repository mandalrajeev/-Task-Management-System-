import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function NewTask() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    deadline: '',
    team_id: '',
    assigned_to: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/teams').then(({ data }) => setTeams(data.teams));
  }, []);

  useEffect(() => {
    const team = teams.find((t) => t.id === form.team_id);
    setMembers(team ? team.members : []);
  }, [form.team_id, teams]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
        team_id: form.team_id || undefined,
        assigned_to: form.assigned_to || undefined
      };
      const { data } = await api.post('/tasks', payload);
      navigate(`/tasks/${data.task.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>New task</h1>
          <p className="subtitle">Assign work to a team member with a clear deadline and priority.</p>
        </div>
      </div>

      <div className="form-card" style={{ maxWidth: 520 }}>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" required value={form.title} onChange={update('title')} />
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea id="description" value={form.description} onChange={update('description')} />
          </div>
          <div className="field">
            <label htmlFor="team">Team</label>
            <select id="team" value={form.team_id} onChange={update('team_id')}>
              <option value="">No team</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="assignee">Assign to</label>
            <select id="assignee" value={form.assigned_to} onChange={update('assigned_to')} disabled={!members.length}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="priority">Priority</label>
            <select id="priority" value={form.priority} onChange={update('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="deadline">Deadline</label>
            <input id="deadline" type="date" value={form.deadline} onChange={update('deadline')} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create task'}
          </button>
        </form>
      </div>
    </div>
  );
}
