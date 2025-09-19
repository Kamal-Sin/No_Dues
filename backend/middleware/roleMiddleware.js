// This middleware checks if the authenticated user has the required role(s).
// It should be used *after* the `protect` middleware.

exports.authorize = (...roles) => { // Takes an array of allowed roles
  return (req, res, next) => {
    // req.user should be populated by the `protect` middleware
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'User role not found in token. Authorization denied.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role '${req.user.role}' is not authorized to access this route. Required roles: ${roles.join(', ')}.`,
      });
    }
    next(); // User has one of the required roles, proceed
  };
};