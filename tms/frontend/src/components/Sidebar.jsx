import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABEL = { admin: 'Admin', manager: 'Manager', user: 'Team member' };

export default function Sidebar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <aside className="sidebar">
      <div className="brand">Basecamp Tasks</div>
      <nav>
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
          Dashboard
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => (isActive ? 'active' : '')}>
          Tasks
        </NavLink>
        <NavLink to="/teams" className={({ isActive }) => (isActive ? 'active' : '')}>
          Teams
        </NavLink>
        {user.role === 'admin' && (
          <NavLink to="/users" className={({ isActive }) => (isActive ? 'active' : '')}>
            People
          </NavLink>
        )}
      </nav>
      <div className="role-pill">
        <strong>{user.name}</strong>
        {ROLE_LABEL[user.role] || user.role}
      </div>
      <button className="logout-btn" onClick={logout}>
        Log out
      </button>
    </aside>
  );
}
