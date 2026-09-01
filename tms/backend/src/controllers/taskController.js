const { Op } = require('sequelize');
const { Task, User, Team, TeamMember } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const asyncHandler = require('../utils/asyncHandler');
const notify = require('../utils/notify');

const taskIncludes = [
  { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'assigner', attributes: ['id', 'name', 'email'] },
  { model: Team, as: 'team', attributes: ['id', 'name'] }
];

/** Builds a Sequelize `where` clause honoring the requester's role, plus any query filters. */
async function buildScopedWhere(user, query) {
  const { status, priority, deadline_before, deadline_after, team_id, search } = query;
  const where = {};

  if (user.role === 'user') {
    where.assigned_to = user.id;
  } else if (user.role === 'manager') {
    const teams = await Team.findAll({ where: { manager_id: user.id }, attributes: ['id'] });
    const teamIds = teams.map((t) => t.id);
    where.team_id = { [Op.in]: teamIds.length ? teamIds : ['00000000-0000-0000-0000-000000000000'] };
  }
  // admin: no restriction

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (team_id) where.team_id = team_id;
  if (search) where.title = { [Op.iLike]: `%${search}%` };

  if (deadline_before || deadline_after) {
    where.deadline = {};
    if (deadline_before) where.deadline[Op.lte] = new Date(deadline_before);
    if (deadline_after) where.deadline[Op.gte] = new Date(deadline_after);
  }

  return where;
}

// GET /api/tasks?status=&priority=&deadline_before=&deadline_after=&team_id=&search=
const listTasks = asyncHandler(async (req, res) => {
  const where = await buildScopedWhere(req.user, req.query);
  const tasks = await Task.findAll({
    where,
    include: taskIncludes,
    order: [
      ['deadline', 'ASC NULLS LAST'],
      ['created_at', 'DESC']
    ]
  });
  res.json({ success: true, tasks });
});

// GET /api/tasks/:id
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findByPk(req.params.id, { include: taskIncludes });
  if (!task) throw new ApiError(404, 'Task not found');

  if (req.user.role === 'user' && task.assigned_to !== req.user.id) {
    throw new ApiError(403, 'You do not have access to this task');
  }
  res.json({ success: true, task });
});

// POST /api/tasks  (admin, manager)
const createTask = asyncHandler(async (req, res) => {
  const { title, description, priority, deadline, team_id, assigned_to } = req.body;

  if (team_id) {
    const team = await Team.findByPk(team_id);
    if (!team) throw new ApiError(404, 'Team not found');
    if (req.user.role === 'manager' && team.manager_id !== req.user.id) {
      throw new ApiError(403, 'You can only assign tasks within teams you manage');
    }
  }

  if (assigned_to) {
    const assignee = await User.findByPk(assigned_to);
    if (!assignee) throw new ApiError(404, 'Assignee not found');
    if (team_id) {
      const isMember = await TeamMember.findOne({ where: { team_id, user_id: assigned_to } });
      if (!isMember) throw new ApiError(400, 'Assignee must be a member of the selected team');
    }
  }

  const task = await Task.create({
    title,
    description,
    priority: priority || 'medium',
    deadline: deadline || null,
    team_id: team_id || null,
    assigned_to: assigned_to || null,
    assigned_by: req.user.id
  });

  if (assigned_to) {
    await notify({
      userId: assigned_to,
      taskId: task.id,
      type: 'task_assigned',
      message: `You were assigned a new task: "${task.title}"`
    });
  }

  const full = await Task.findByPk(task.id, { include: taskIncludes });
  res.status(201).json({ success: true, task: full });
});

// PATCH /api/tasks/:id  (admin, manager: full edit. user: status only, on own tasks)
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');

  const isOwner = task.assigned_to === req.user.id;
  const isPrivileged = req.user.role === 'admin' || req.user.role === 'manager';

  if (!isPrivileged && !isOwner) {
    throw new ApiError(403, 'You do not have access to this task');
  }

  const previousStatus = task.status;
  const previousAssignee = task.assigned_to;

  if (isPrivileged) {
    const { title, description, priority, deadline, team_id, assigned_to, status } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (deadline !== undefined) task.deadline = deadline;
    if (team_id !== undefined) task.team_id = team_id;
    if (assigned_to !== undefined) task.assigned_to = assigned_to;
    if (status !== undefined) task.status = status;
  } else {
    // Regular users may only update status on their own task.
    const { status } = req.body;
    if (status === undefined) throw new ApiError(400, 'Only the task status can be updated');
    task.status = status;
  }

  await task.save();

  if (task.assigned_to && task.assigned_to !== previousAssignee) {
    await notify({
      userId: task.assigned_to,
      taskId: task.id,
      type: 'task_assigned',
      message: `You were assigned to task: "${task.title}"`
    });
  }

  if (task.status !== previousStatus) {
    // Notify the assigner (and the assignee, if someone else changed it) about the status change.
    const recipients = new Set([task.assigned_by]);
    if (task.assigned_to) recipients.add(task.assigned_to);
    recipients.delete(req.user.id); // don't notify the person who made the change

    await Promise.all(
      [...recipients].map((userId) =>
        notify({
          userId,
          taskId: task.id,
          type: 'status_changed',
          message: `Task "${task.title}" status changed to "${task.status.replace('_', ' ')}"`
        })
      )
    );
  }

  const full = await Task.findByPk(task.id, { include: taskIncludes });
  res.json({ success: true, task: full });
});

// DELETE /api/tasks/:id  (admin, manager who owns the team)
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');

  if (req.user.role === 'manager') {
    const team = task.team_id ? await Team.findByPk(task.team_id) : null;
    if (!team || team.manager_id !== req.user.id) {
      throw new ApiError(403, 'You can only delete tasks within teams you manage');
    }
  }

  await task.destroy();
  res.json({ success: true, message: 'Task deleted' });
});

module.exports = { listTasks, getTask, createTask, updateTask, deleteTask };
