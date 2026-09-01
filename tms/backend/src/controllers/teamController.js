const { Team, TeamMember, User } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const asyncHandler = require('../utils/asyncHandler');
const { Op } = require('sequelize');

const teamIncludes = [
  { model: User, as: 'manager', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'members', attributes: ['id', 'name', 'email', 'role'], through: { attributes: [] } }
];

// GET /api/teams - admins see all, managers see their teams, users see teams they belong to
const listTeams = asyncHandler(async (req, res) => {
  const { id, role } = req.user;
  let where = {};

  if (role === 'manager') {
    where = { manager_id: id };
  } else if (role === 'user') {
    const memberships = await TeamMember.findAll({ where: { user_id: id }, attributes: ['team_id'] });
    const teamIds = memberships.map((m) => m.team_id);
    where = { id: { [Op.in]: teamIds.length ? teamIds : ['00000000-0000-0000-0000-000000000000'] } };
  }

  const teams = await Team.findAll({ where, include: teamIncludes, order: [['created_at', 'DESC']] });
  res.json({ success: true, teams });
});

// GET /api/teams/:id
const getTeam = asyncHandler(async (req, res) => {
  const team = await Team.findByPk(req.params.id, { include: teamIncludes });
  if (!team) throw new ApiError(404, 'Team not found');
  res.json({ success: true, team });
});

// POST /api/teams  (admin only)
const createTeam = asyncHandler(async (req, res) => {
  const { name, description, manager_id } = req.body;

  if (manager_id) {
    const manager = await User.findByPk(manager_id);
    if (!manager || manager.role !== 'manager') {
      throw new ApiError(400, 'manager_id must reference a user with the manager role');
    }
  }

  const team = await Team.create({
    name,
    description,
    manager_id: manager_id || null,
    created_by: req.user.id
  });

  const full = await Team.findByPk(team.id, { include: teamIncludes });
  res.status(201).json({ success: true, team: full });
});

// PATCH /api/teams/:id  (admin only)
const updateTeam = asyncHandler(async (req, res) => {
  const team = await Team.findByPk(req.params.id);
  if (!team) throw new ApiError(404, 'Team not found');

  const { name, description, manager_id } = req.body;
  if (name !== undefined) team.name = name;
  if (description !== undefined) team.description = description;
  if (manager_id !== undefined) team.manager_id = manager_id;

  await team.save();
  const full = await Team.findByPk(team.id, { include: teamIncludes });
  res.json({ success: true, team: full });
});

// DELETE /api/teams/:id (admin only)
const deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findByPk(req.params.id);
  if (!team) throw new ApiError(404, 'Team not found');
  await team.destroy();
  res.json({ success: true, message: 'Team deleted' });
});

// POST /api/teams/:id/members  (admin only) - body: { user_id }
const addMember = asyncHandler(async (req, res) => {
  const team = await Team.findByPk(req.params.id);
  if (!team) throw new ApiError(404, 'Team not found');

  const { user_id } = req.body;
  const user = await User.findByPk(user_id);
  if (!user) throw new ApiError(404, 'User not found');

  const [membership, created] = await TeamMember.findOrCreate({
    where: { team_id: team.id, user_id },
    defaults: { team_id: team.id, user_id }
  });

  if (!created) throw new ApiError(409, 'User is already a member of this team');

  const full = await Team.findByPk(team.id, { include: teamIncludes });
  res.status(201).json({ success: true, team: full });
});

// DELETE /api/teams/:id/members/:userId (admin only)
const removeMember = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;
  const deleted = await TeamMember.destroy({ where: { team_id: id, user_id: userId } });
  if (!deleted) throw new ApiError(404, 'Membership not found');
  const full = await Team.findByPk(id, { include: teamIncludes });
  res.json({ success: true, team: full });
});

module.exports = { listTeams, getTeam, createTeam, updateTeam, deleteTeam, addMember, removeMember };
