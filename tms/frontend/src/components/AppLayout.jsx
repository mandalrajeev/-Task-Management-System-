import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <div className="topbar">
          <NotificationBell />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
