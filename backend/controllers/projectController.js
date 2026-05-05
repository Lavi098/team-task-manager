const Project = require('../models/Project');
const User = require('../models/User');

// Helper: get user's role in project
const getUserRole = (project, userId) => {
  const member = project.members.find(
    (m) => m.user.toString() === userId.toString()
  );
  return member ? member.role : null;
};

// @desc    Create a project
// @route   POST /api/projects
const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const project = await Project.create({
      name,
      description,
      members: [{ user: req.user._id, role: 'Admin' }],
    });

    await project.populate('members.user', 'name email');
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all projects for current user
// @route   GET /api/projects
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id }).populate(
      'members.user',
      'name email'
    );
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      'members.user',
      'name email'
    );

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const role = getUserRole(project, req.user._id);
    if (!role) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ ...project.toObject(), currentUserRole: role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update project (Admin only)
// @route   PUT /api/projects/:id
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const role = getUserRole(project, req.user._id);
    if (role !== 'Admin') {
      return res.status(403).json({ message: 'Only admins can update projects' });
    }

    const { name, description } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;

    await project.save();
    await project.populate('members.user', 'name email');
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete project (Admin only)
// @route   DELETE /api/projects/:id
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const role = getUserRole(project, req.user._id);
    if (role !== 'Admin') {
      return res.status(403).json({ message: 'Only admins can delete projects' });
    }

    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Add member to project (Admin only)
// @route   POST /api/projects/:id/members
const addMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const role = getUserRole(project, req.user._id);
    if (role !== 'Admin') {
      return res.status(403).json({ message: 'Only admins can add members' });
    }

    const { email, memberRole } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    if (typeof email !== 'string') {
      return res.status(400).json({ message: 'Invalid email' });
    }

    const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToAdd) return res.status(404).json({ message: 'User not found' });

    const alreadyMember = project.members.some(
      (m) => m.user.toString() === userToAdd._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    project.members.push({
      user: userToAdd._id,
      role: memberRole === 'Admin' ? 'Admin' : 'Member',
    });

    await project.save();
    await project.populate('members.user', 'name email');
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Remove member from project (Admin only)
// @route   DELETE /api/projects/:id/members/:userId
const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const role = getUserRole(project, req.user._id);
    if (role !== 'Admin') {
      return res.status(403).json({ message: 'Only admins can remove members' });
    }

    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot remove yourself from the project' });
    }

    project.members = project.members.filter(
      (m) => m.user.toString() !== req.params.userId
    );

    await project.save();
    await project.populate('members.user', 'name email');
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
