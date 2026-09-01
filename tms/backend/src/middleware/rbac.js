const { ApiError } = require('./errorHandler');

/**
 * Restricts a route to the given roles.
 * Usage: router.post('/teams', authenticate, authorize('admin'), handler)
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }
  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, `Role '${req.user.role}' is not permitted to perform this action`));
  }
  next();
};

module.exports = authorize;
