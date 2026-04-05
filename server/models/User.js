const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  socketId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  color: { type: String, required: true },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  connectedTo: { type: String, default: null }, // socketId of current proximity partner
  lastSeen: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
