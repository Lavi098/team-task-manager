import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Modal from '../components/Modal';

const STATUS_OPTIONS = ['To Do', 'In Progress', 'Done'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];

const getBadgeClass = (status) => {
  if (status === 'To Do') return 'badge-todo';
  if (status === 'In Progress') return 'badge-inprogress';
  return 'badge-done';
};

const getPriorityClass = (priority) => {
  if (priority === 'Low') return 'badge-low';
  if (priority === 'Medium') return 'badge-medium';
  return 'badge-high';
};

const isOverdue = (task) => {
  if (!task.dueDate || task.status === 'Done') return false;
  return new Date(task.dueDate) < new Date();
};

const TasksPage = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Medium',
    assignedTo: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchData = useCallback(async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/tasks?projectId=${projectId}`),
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isAdmin = project?.currentUserRole === 'Admin';

  const openCreate = () => {
    setForm({ title: '', description: '', dueDate: '', priority: 'Medium', assignedTo: '' });
    setFormError('');
    setShowCreate(true);
  };

  const openEdit = (task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      priority: task.priority,
      assignedTo: task.assignedTo?._id || '',
      status: task.status,
    });
    setFormError('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/tasks', { ...form, projectId });
      setShowCreate(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.put(`/tasks/${editTask._id}`, form);
      setEditTask(null);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const members = project?.members || [];

  if (loading) return <div className="loading">Loading tasks…</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <span
            className="back-link"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            ← {project?.name}
          </span>
          <h1>Tasks</h1>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            + New Task
          </button>
        )}
      </div>

      <div className="page-body">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="filter-bar">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="">All Priorities</option>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
            {filteredTasks.length} task(s)
          </span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>{isAdmin ? 'No tasks yet. Create the first task!' : 'No tasks assigned to you.'}</p>
          </div>
        ) : (
          <div className="task-list">
            {filteredTasks.map((task) => {
              const overdue = isOverdue(task);
              const canEdit =
                isAdmin || task.assignedTo?._id === currentUser._id;
              return (
                <div key={task._id} className="task-card">
                  <div className="task-card-body">
                    <h4>{task.title}</h4>
                    {task.description && <p>{task.description}</p>}
                    <div className="task-meta">
                      <span className={`badge ${getBadgeClass(task.status)}`}>
                        {task.status}
                      </span>
                      <span className={`badge ${getPriorityClass(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.assignedTo && (
                        <span>👤 {task.assignedTo.name}</span>
                      )}
                      {task.dueDate && (
                        <span className={overdue ? 'overdue' : ''}>
                          📅 {new Date(task.dueDate).toLocaleDateString()}
                          {overdue && ' (Overdue)'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="task-card-actions">
                    {canEdit && task.status !== 'Done' && (
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task._id, e.target.value)}
                        style={{
                          fontSize: '0.8rem',
                          padding: '0.25rem 0.5rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius)',
                        }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                    {isAdmin && (
                      <>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEdit(task)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(task._id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreate && (
        <Modal title="Create New Task" onClose={() => setShowCreate(false)}>
          {formError && <div className="alert alert-error">{formError}</div>}
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Task title"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Task description…"
              />
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Assign To</label>
              <select
                value={form.assignedTo}
                onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))}
              >
                <option value="">— Unassigned —</option>
                {members.map(({ user }) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Task'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Task Modal */}
      {editTask && (
        <Modal title="Edit Task" onClose={() => setEditTask(null)}>
          {formError && <div className="alert alert-error">{formError}</div>}
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Assign To</label>
              <select
                value={form.assignedTo}
                onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))}
              >
                <option value="">— Unassigned —</option>
                {members.map(({ user }) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditTask(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

export default TasksPage;
