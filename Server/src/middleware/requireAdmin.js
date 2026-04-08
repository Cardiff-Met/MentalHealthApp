// Middleware that restricts a route to admin users only.
// Must be used AFTER authenticateToken so req.user is populated.
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }
  next();
}

module.exports = requireAdmin;
