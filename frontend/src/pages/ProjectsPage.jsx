import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Modal from '../components/Modal';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = () => {
    setLoading(true);
    api.get('/projects')
      .then((res) => setProjects(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load projects'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/projects', form);
      setShowModal(false);
      setForm({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const getUserRole = (project) => {
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    const member = project.members.find((m) => m.user._id === stored._id);
    return member?.role;
  };

  if (loading) return <div className="loading">Loading projects…</div>;

  return (
    <>
      <div className="page-header">
        <h1>Projects</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Project
        </button>
      </div>
      <div className="page-body">
        {error && <div className="alert alert-error">{error}</div>}

        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <p>No projects yet. Create your first project to get started!</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => {
              const role = getUserRole(project);
              return (
                <div
                  key={project._id}
                  className="project-card"
                  onClick={() => navigate(`/projects/${project._id}`)}
                >
                  <h3>{project.name}</h3>
                  <p>{project.description || 'No description provided.'}</p>
                  <div className="project-meta">
                    <span>{project.members.length} member(s)</span>
                    <span className={`badge badge-${role?.toLowerCase()}`}>{role}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Create New Project" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Project Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Website Redesign"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of the project…"
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Project'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

export default ProjectsPage;
