import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import Modal from '../components/Modal';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState({ email: '', memberRole: 'Member' });
  const [memberError, setMemberError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProject = () => {
    api.get(`/projects/${id}`)
      .then((res) => setProject(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load project'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const isAdmin = project?.currentUserRole === 'Admin';

  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberError('');
    setSubmitting(true);
    try {
      await api.post(`/projects/${id}/members`, memberForm);
      setShowAddMember(false);
      setMemberForm({ email: '', memberRole: 'Member' });
      fetchProject();
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      fetchProject();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${id}`);
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete project');
    }
  };

  if (loading) return <div className="loading">Loading project…</div>;
  if (error && !project) return (
    <div className="page-body">
      <div className="alert alert-error">{error}</div>
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div>
          <span
            className="back-link"
            onClick={() => navigate('/projects')}
          >
            ← Projects
          </span>
          <h1>{project?.name}</h1>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/projects/${id}/tasks`)}
          >
            📋 View Tasks
          </button>
          {isAdmin && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddMember(true)}
              >
                + Add Member
              </button>
              <button className="btn btn-danger" onClick={handleDeleteProject}>
                Delete Project
              </button>
            </>
          )}
        </div>
      </div>

      <div className="page-body">
        {error && <div className="alert alert-error">{error}</div>}

        {project?.description && (
          <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
            {project.description}
          </p>
        )}

        <div className="card">
          <div className="card-title">
            Team Members ({project?.members?.length || 0})
          </div>
          <table className="members-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {project?.members?.map(({ user, role }) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge badge-${role.toLowerCase()}`}>{role}</span>
                  </td>
                  {isAdmin && (
                    <td>
                      {user._id !== JSON.parse(localStorage.getItem('user') || '{}')._id && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveMember(user._id)}
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddMember && (
        <Modal title="Add Team Member" onClose={() => setShowAddMember(false)}>
          {memberError && <div className="alert alert-error">{memberError}</div>}
          <form onSubmit={handleAddMember}>
            <div className="form-group">
              <label>Member Email *</label>
              <input
                type="email"
                value={memberForm.email}
                onChange={(e) => setMemberForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select
                value={memberForm.memberRole}
                onChange={(e) => setMemberForm((f) => ({ ...f, memberRole: e.target.value }))}
              >
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddMember(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Adding…' : 'Add Member'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

export default ProjectDetailPage;
