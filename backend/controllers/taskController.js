const Task = require('../models/Task');
const Project = require('../models/Project');

// Helper: get user's role in project
const getUserRole = (project, userId) => {
  const member = project.members.find(
    (m) => m.user.toString() === userId.toString()
  );
  return member ? member.role : null;
};

// @desc    Create task (Admin only)
// @route   POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description, dueDate, priority, projectId, assignedTo } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ message: 'Title and project are required' });
    }

    if (typeof projectId !== 'string') {
      return res.status(400).json({ message: 'Invalid projectId' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const role = getUserRole(project, req.user._id);
    if (!role) return res.status(403).json({ message: 'Access denied' });
    if (role !== 'Admin') {
      return res.status(403).json({ message: 'Only admins can create tasks' });
    }

    // Validate assignedTo is a project member
    if (assignedTo) {
      const isMember = project.members.some(
        (m) => m.user.toString() === assignedTo
      );
      if (!isMember) {
        return res.status(400).json({ message: 'Assigned user is not a project member' });
      }
    }

    const task = await Task.create({
      title,
      description,
      dueDate,
      priority,
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
    });

    await task.populate(['assignedTo', 'createdBy'], 'name email');
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get tasks for a project
// @route   GET /api/tasks?projectId=xxx
const getTasks = async (req, res) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: 'projectId query parameter is required' });
    }

    if (typeof projectId !== 'string') {
      return res.status(400).json({ message: 'Invalid projectId' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const role = getUserRole(project, req.user._id);
    if (!role) return res.status(403).json({ message: 'Access denied' });

    let query = { project: projectId };

    // Members only see tasks assigned to them
    if (role === 'Member') {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name members');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project._id);
    const role = getUserRole(project, req.user._id);
    if (!role) return res.status(403).json({ message: 'Access denied' });

    // Member can only see their assigned tasks
    if (
      role === 'Member' &&
      task.assignedTo?._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    const role = getUserRole(project, req.user._id);
    if (!role) return res.status(403).json({ message: 'Access denied' });

    const { title, description, dueDate, priority, status, assignedTo } = req.body;

    if (role === 'Admin') {
      // Admin can update everything
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (priority !== undefined) task.priority = priority;
      if (status !== undefined) task.status = status;
      if (assignedTo !== undefined) {
        if (assignedTo) {
          const isMember = project.members.some(
            (m) => m.user.toString() === assignedTo
          );
          if (!isMember) {
            return res.status(400).json({ message: 'Assigned user is not a project member' });
          }
        }
        task.assignedTo = assignedTo || null;
      }
    } else {
      // Member can only update status of their assigned tasks
      if (task.assignedTo?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (status !== undefined) task.status = status;
    }

    await task.save();
    await task.populate(['assignedTo', 'createdBy'], 'name email');
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete task (Admin only)
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    const role = getUserRole(project, req.user._id);
    if (!role) return res.status(403).json({ message: 'Access denied' });
    if (role !== 'Admin') {
      return res.status(403).json({ message: 'Only admins can delete tasks' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createTask, getTasks, getTask, updateTask, deleteTask };
