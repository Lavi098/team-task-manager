const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Get dashboard stats
// @route   GET /api/dashboard
const getDashboard = async (req, res) => {
  try {
    // Get all projects the user is a member of
    const projects = await Project.find({ 'members.user': req.user._id });
    const projectIds = projects.map((p) => p._id);

    // Determine admin projects
    const adminProjectIds = projects
      .filter((p) =>
        p.members.some(
          (m) => m.user.toString() === req.user._id.toString() && m.role === 'Admin'
        )
      )
      .map((p) => p._id);

    // For members: only their assigned tasks; for admin: all tasks in their projects
    let taskQuery;
    const isAnyAdmin = adminProjectIds.length > 0;

    if (isAnyAdmin) {
      taskQuery = { project: { $in: projectIds } };
    } else {
      taskQuery = { project: { $in: projectIds }, assignedTo: req.user._id };
    }

    const tasks = await Task.find(taskQuery)
      .populate('assignedTo', 'name email')
      .populate('project', 'name');

    const now = new Date();

    const stats = {
      totalTasks: tasks.length,
      byStatus: {
        'To Do': 0,
        'In Progress': 0,
        Done: 0,
      },
      overdueTasks: 0,
      byUser: {},
      totalProjects: projects.length,
    };

    tasks.forEach((task) => {
      // Count by status
      stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;

      // Count overdue (dueDate in the past and not done)
      if (task.dueDate && task.dueDate < now && task.status !== 'Done') {
        stats.overdueTasks += 1;
      }

      // Count per user
      if (task.assignedTo) {
        const userId = task.assignedTo._id.toString();
        if (!stats.byUser[userId]) {
          stats.byUser[userId] = {
            user: task.assignedTo,
            count: 0,
          };
        }
        stats.byUser[userId].count += 1;
      }
    });

    // Convert byUser map to array
    stats.byUser = Object.values(stats.byUser);

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getDashboard };
