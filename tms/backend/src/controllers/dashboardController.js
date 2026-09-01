const { Op } = require('sequelize');
const { Task, Team, User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const { id, role } = req.user;
  let where = {};

  if (role === 'user') {
    where.assigned_to = id;
  } else if (role === 'manager') {
    const teams = await Team.findAll({ where: { manager_id: id }, attributes: ['id'] });
    const teamIds = teams.map((t) => t.id);
    where.team_id = { [Op.in]: teamIds.length ? teamIds : ['00000000-0000-0000-0000-000000000000'] };
  }

  const tasks = await Task.findAll({
    where,
    attributes: ['id', 'status', 'priority', 'deadline', 'assigned_to'],
    include: role !== 'user' ? [{ model: User, as: 'assignee', attributes: ['id', 'name'] }] : []
  });

  const now = new Date();
  const statusCounts = { todo: 0, in_progress: 0, done: 0 };
  const priorityCounts = { low: 0, medium: 0, high: 0 };
  let overdue = 0;
  let dueSoon = 0; // within next 48 hours, not done

  const byUserMap = new Map(); // for admin/manager: task counts per assignee

  tasks.forEach((t) => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;

    if (t.deadline && t.status !== 'done') {
      const deadline = new Date(t.deadline);
      if (deadline < now) overdue += 1;
      else if (deadline - now <= 48 * 60 * 60 * 1000) dueSoon += 1;
    }

    if (role !== 'user') {
      const key = t.assignee ? t.assignee.id : 'unassigned';
      const label = t.assignee ? t.assignee.name : 'Unassigned';
      if (!byUserMap.has(key)) byUserMap.set(key, { userId: key, name: label, todo: 0, in_progress: 0, done: 0 });
      byUserMap.get(key)[t.status] += 1;
    }
  });

  res.json({
    success: true,
    totalTasks: tasks.length,
    statusCounts,
    priorityCounts,
    overdue,
    dueSoon,
    byUser: role !== 'user' ? [...byUserMap.values()] : undefined
  });
});

module.exports = { getDashboard };
