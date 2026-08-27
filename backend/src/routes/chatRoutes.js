const express = require('express');
const { protect } = require('../middleware/auth');
const { createChat, getChatHistory, getChatById, deleteChat, sendMessage } = require('../controllers/chatController');

const router = express.Router();

router.post('/', protect, createChat);
router.get('/history', protect, getChatHistory);
router.get('/:id', protect, getChatById);
router.delete('/:id', protect, deleteChat);
router.post('/send', protect, sendMessage);

module.exports = router;
