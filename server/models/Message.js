const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true }, // e.g. "userId1-userId2" sorted
  sender: { type: String, required: true }, // username
  senderId: { type: String, required: true }, // socketId
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
