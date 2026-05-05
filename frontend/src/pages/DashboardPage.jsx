import { useState, useEffect } from 'react';
import api from '../utils/api';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard…</div>;

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>
      <div className="page-body">
        {error && <div className="alert alert-error">{error}</div>}

        {stats && (
          <>
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-label">Total Projects</div>
                <div className="stat-value">{stats.totalProjects}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Tasks</div>
                <div className="stat-value">{stats.totalTasks}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">To Do</div>
                <div className="stat-value">{stats.byStatus['To Do'] || 0}</div>
              </div>
              <div className="stat-card" style={{ '--value-color': '#d97706' }}>
                <div className="stat-label">In Progress</div>
                <div className="stat-value" style={{ color: '#d97706' }}>
                  {stats.byStatus['In Progress'] || 0}
                </div>
              </div>
              <div className="stat-card success">
                <div className="stat-label">Done</div>
                <div className="stat-value">{stats.byStatus['Done'] || 0}</div>
              </div>
              <div className="stat-card danger">
                <div className="stat-label">Overdue Tasks</div>
                <div className="stat-value">{stats.overdueTasks}</div>
              </div>
            </div>

            {stats.byUser && stats.byUser.length > 0 && (
              <div className="card">
                <div className="card-title">Tasks Per User</div>
                <table className="members-table">
                  <thead>
                    <tr>
                      <th>Team Member</th>
                      <th>Email</th>
                      <th>Assigned Tasks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byUser.map(({ user, count }) => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className="badge badge-admin">{count}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {(!stats.byUser || stats.byUser.length === 0) && stats.totalTasks === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <p>No tasks yet. Create a project and add tasks to see your dashboard.</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default DashboardPage;
