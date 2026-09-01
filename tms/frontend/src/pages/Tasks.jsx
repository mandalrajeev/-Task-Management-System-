import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { StatusTag, PriorityTag } from '../components/Tags';

function formatDeadline(d) {
  if (!d) return 'No deadline';
  const date = new Date(d);
  const overdue = date < new Date();
  return `${overdue ? 'Overdue · ' : 'Due '}${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });

  const canCreate = user.role === 'admin' || user.role === 'manager';

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;
      const { data } = await api.get('/tasks', { params });
      setTasks(data.tasks);
    } catch {
      setError('Could not load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.priority]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    load();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p className="subtitle">
            {user.role === 'user' ? 'Everything assigned to you.' : 'Everything across your teams.'}
          </p>
        </div>
        {canCreate && (
          <Link to="/tasks/new" className="btn btn-primary">
            + New task
          </Link>
        )}
      </div>

      <form className="filter-bar" onSubmit={handleSearchSubmit}>
        <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All statuses</option>
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </select>
        <select value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <input
          type="search"
          placeholder="Search by title…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
        <button className="btn btn-ghost btn-sm" type="submit">
          Search
        </button>
      </form>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <div className="empty-state">No tasks match these filters yet.</div>
      ) : (
        <div className="list">
          {tasks.map((t) => (
            <Link to={`/tasks/${t.id}`} className="list-row" key={t.id}>
              <span className="title">{t.title}</span>
              {user.role !== 'user' && <span className="meta">{t.assignee ? t.assignee.name : 'Unassigned'}</span>}
              <PriorityTag priority={t.priority} />
              <StatusTag status={t.status} />
              <span className="meta">{formatDeadline(t.deadline)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
