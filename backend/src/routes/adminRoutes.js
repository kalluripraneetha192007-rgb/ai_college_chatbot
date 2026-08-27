const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const { getAdminOverview } = require('../controllers/adminController');

const router = express.Router();

router.get('/overview', protect, adminOnly, getAdminOverview);

module.exports = router;
