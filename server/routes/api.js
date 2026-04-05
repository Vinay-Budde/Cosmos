const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');

// GET /api/messages/:roomId -> Return last 50 messages for that room, sorted by timestamp
router.get('/messages/:roomId', async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId })
      .sort({ timestamp: 1 }) // oldest to newest
      .limit(50);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Server error retrieving messages' });
  }
});

// GET /api/users/online -> Return list of all currently connected users
router.get('/users/online', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error retrieving users' });
  }
});

// GET /api/health -> Simple health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

module.exports = router;
