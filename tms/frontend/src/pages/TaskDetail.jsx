import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { StatusTag, PriorityTag } from '../components/Tags';

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentBody, setCommentBody] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isPrivileged = user.role === 'admin' || user.role === 'manager';

  const load = async () => {
    try {
      const [taskRes, commentsRes] = await Promise.all([
        api.get(`/tasks/${id}`),
        api.get(`/tasks/${id}/comments`)
      ]);
      setTask(taskRes.data.task);
      setComments(commentsRes.data.comments);
    } catch {
      setError('Could not load this task.');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateStatus = async (status) => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/tasks/${id}`, { status });
      setTask(data.task);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update status.');
    } finally {
      setSaving(false);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    try {
      const { data } = await api.post(`/tasks/${id}/comments`, { body: commentBody });
      setComments((c) => [...c, data.comment]);
      setCommentBody('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not post comment.');
    }
  };

  const deleteTask = async () => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    await api.delete(`/tasks/${id}`);
    navigate('/tasks');
  };

  if (error && !task) return <div className="error-banner">{error}</div>;
  if (!task) return <p>Loading task…</p>;

  return (
    <div>
      <Link to="/tasks" style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
        ← Back to tasks
      </Link>

      <div className="page-header" style={{ marginTop: 12 }}>
        <div>
          <h1>{task.title}</h1>
          <p className="subtitle">
            {task.team ? `${task.team.name} · ` : ''}
            Assigned to {task.assignee ? task.assignee.name : 'nobody yet'} by {task.assigner?.name}
          </p>
        </div>
        {isPrivileged && (
          <button className="btn btn-danger btn-sm" onClick={deleteTask}>
            Delete task
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
        <PriorityTag priority={task.priority} />
        <StatusTag status={task.status} />
        {task.deadline && (
          <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
            Due {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </div>

      {task.description && <p>{task.description}</p>}

      <div className="field" style={{ maxWidth: 260, marginTop: 24 }}>
        <label htmlFor="status">Update status</label>
        <select id="status" value={task.status} disabled={saving} onChange={(e) => updateStatus(e.target.value)}>
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      <h2 style={{ marginTop: 36 }}>Comments</h2>
      <div className="list" style={{ borderTop: 'none' }}>
        {comments.length === 0 && <div className="empty-state">No comments yet — start the discussion.</div>}
        {comments.map((c) => (
          <div className="comment" key={c.id}>
            <div className="comment-meta">
              <strong>{c.author?.name}</strong> · {new Date(c.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </div>
            {c.body}
          </div>
        ))}
      </div>

      <form onSubmit={submitComment} style={{ marginTop: 16 }}>
        <div className="field">
          <label htmlFor="comment">Add a comment</label>
          <textarea
            id="comment"
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Share an update or ask a question…"
          />
        </div>
        <button className="btn btn-primary" type="submit">
          Post comment
        </button>
      </form>
    </div>
  );
}
