const express = require('express');
const { registerUser, loginUser, adminLogin, getMe, logoutUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/admin-login', adminLogin);
router.get('/me', protect, getMe);
router.post('/logout', protect, logoutUser);

module.exports = router;
