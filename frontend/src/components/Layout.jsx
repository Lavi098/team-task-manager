import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>📋</span>
          <span>TaskManager</span>
        </div>
        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span>📊</span>
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/projects"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span>📁</span>
            <span>Projects</span>
          </NavLink>
        </nav>
        <div className="sidebar-user">
          <div className="user-name">{user?.name}</div>
          <div className="user-email" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
            {user?.email}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
