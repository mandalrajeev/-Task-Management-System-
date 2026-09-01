const { User } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/users  (admin, manager)
const listUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  const where = role ? { role } : {};
  const users = await User.findAll({ where, order: [['name', 'ASC']] });
  res.json({ success: true, users: users.map((u) => u.toSafeJSON()) });
});

// POST /api/users  (admin only) - provision manager/user/admin accounts
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password_hash: password,
    role: role || 'user'
  });

  res.status(201).json({ success: true, user: user.toSafeJSON() });
});

// PATCH /api/users/:id  (admin only) - update role / active status
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  const { name, role, is_active } = req.body;
  if (name !== undefined) user.name = name;
  if (role !== undefined) user.role = role;
  if (is_active !== undefined) user.is_active = is_active;

  await user.save();
  res.json({ success: true, user: user.toSafeJSON() });
});

// DELETE /api/users/:id (admin only) - soft delete via deactivation
const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  user.is_active = false;
  await user.save();
  res.json({ success: true, message: 'User deactivated' });
});

module.exports = { listUsers, createUser, updateUser, deactivateUser };
