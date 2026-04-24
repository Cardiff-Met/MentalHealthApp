function requireTherapist(req, res, next) {
  if (req.user?.role !== 'therapist' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Therapist access required.' });
  }
  next();
}

module.exports = requireTherapist;
