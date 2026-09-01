import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard')
      .then(({ data }) => setData(data))
      .catch(() => setError('Could not load your dashboard right now.'));
  }, []);

  if (error) return <div className="error-banner">{error}</div>;
  if (!data) return <p>Loading dashboard…</p>;

  const { statusCounts, priorityCounts, overdue, dueSoon, totalTasks, byUser } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Welcome back, {user.name.split(' ')[0]}</h1>
          <p className="subtitle">Here's where things stand across your work right now.</p>
        </div>
        <Link to="/tasks" className="btn btn-primary">
          View all tasks
        </Link>
      </div>

      <div className="stat-row">
        <div className="stat">
          <div className="value">{totalTasks}</div>
          <div className="label">Total tasks</div>
        </div>
        <div className="stat">
          <div className="value">{statusCounts.todo}</div>
          <div className="label">To do</div>
        </div>
        <div className="stat">
          <div className="value">{statusCounts.in_progress}</div>
          <div className="label">In progress</div>
        </div>
        <div className="stat">
          <div className="value">{statusCounts.done}</div>
          <div className="label">Done</div>
        </div>
        <div className="stat warn">
          <div className="value">{dueSoon}</div>
          <div className="label">Due within 48h</div>
        </div>
        <div className="stat danger">
          <div className="value">{overdue}</div>
          <div className="label">Overdue</div>
        </div>
      </div>

      <div className="two-col">
        <div>
          <h2>By priority</h2>
          <div className="list">
            {['high', 'medium', 'low'].map((p) => (
              <div className="list-row" key={p}>
                <span className="title" style={{ textTransform: 'capitalize' }}>
                  {p} priority
                </span>
                <span className="meta">{priorityCounts[p] || 0} tasks</span>
              </div>
            ))}
          </div>
        </div>

        {byUser && (
          <div>
            <h2>By team member</h2>
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>To do</th>
                  <th>In progress</th>
                  <th>Done</th>
                </tr>
              </thead>
              <tbody>
                {byUser.map((u) => (
                  <tr key={u.userId}>
                    <td>{u.name}</td>
                    <td>{u.todo}</td>
                    <td>{u.in_progress}</td>
                    <td>{u.done}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
