const { verifyAccessToken } = require('../utils/jwt');
const { ApiError } = require('./errorHandler');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new ApiError(401, 'Missing or malformed Authorization header');
    }

    const payload = verifyAccessToken(token); // throws on expiry / invalid signature

    const user = await User.findByPk(payload.sub);
    if (!user || !user.is_active) {
      throw new ApiError(401, 'User no longer exists or is deactivated');
    }

    req.user = { id: user.id, role: user.role, email: user.email, name: user.name };
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authenticate;
