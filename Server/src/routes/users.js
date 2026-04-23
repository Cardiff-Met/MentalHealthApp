const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  exportData,
} = require('../controllers/userController');

router.get('/me', authenticateToken, getProfile);
router.patch('/me', authenticateToken, updateProfile);
router.patch('/me/password', authenticateToken, changePassword);
router.delete('/me', authenticateToken, deleteAccount);
router.get('/me/export', authenticateToken, exportData);

module.exports = router;
