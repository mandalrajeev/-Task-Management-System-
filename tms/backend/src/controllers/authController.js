const { User } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/auth/register
 * Public self-registration always creates a 'user' role account.
 * Admin/manager accounts are provisioned by an existing admin via
 * POST /api/users (see userController.createUser).
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password_hash: password, // hashed in the beforeCreate hook
    role: 'user'
  });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.status(201).json({ success: true, user: user.toSafeJSON(), accessToken, refreshToken });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user || !user.is_active) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.json({ success: true, user: user.toSafeJSON(), accessToken, refreshToken });
});

// POST /api/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, 'refreshToken is required');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findByPk(payload.sub);
  if (!user || !user.is_active) throw new ApiError(401, 'User no longer exists');

  const accessToken = signAccessToken(user);
  res.json({ success: true, accessToken });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, user: user.toSafeJSON() });
});

module.exports = { register, login, refresh, me };
