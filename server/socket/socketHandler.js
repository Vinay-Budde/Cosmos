const User = require('../models/User');
const Message = require('../models/Message');

module.exports = (io) => {

  // ── On server start, wipe all stale user records ──────────────
  // Any user in the DB from a previous server session is a ghost
  User.deleteMany({}).catch(err => console.error('User table clear error:', err));

  io.on('connection', (socket) => {

    socket.on('join_cosmos', async ({ username, color, x, y }) => {
      console.log(`[JOIN] ${username} (${socket.id})`);

      // Remove any existing record for this exact socket (duplicate join guard)
      await User.findOneAndDelete({ socketId: socket.id });

      // Create fresh record
      await User.create({ socketId: socket.id, username, color, x, y });

      // Only return users whose socket IDs are actively connected RIGHT NOW
      const connectedIds = Array.from(io.sockets.sockets.keys());
      const others = await User.find({
        socketId: { $in: connectedIds, $ne: socket.id }
      });

      socket.emit('all_users', others);
      socket.broadcast.emit('user_joined', {
        socketId: socket.id, username, color, x, y
      });
    });

    socket.on('position_update', async ({ x, y, room }) => {
      await User.findOneAndUpdate({ socketId: socket.id }, { x, y, room });
      socket.broadcast.emit('user_moved', { socketId: socket.id, x, y, room });
    });

    // Proximity signaling
    socket.on('proximity_connect', ({ targetSocketId }) => {
      io.to(targetSocketId).emit('proximity_connect', { targetSocketId: socket.id });
    });

    socket.on('proximity_disconnect', ({ targetSocketId }) => {
      io.to(targetSocketId).emit('proximity_disconnect', { targetSocketId: socket.id });
    });

    // Chat messages
    socket.on('send_message', async ({ roomId, message }) => {
      const user = await User.findOne({ socketId: socket.id });
      if (!user) return;
      const saved = await Message.create({
        roomId, sender: user.username,
        senderId: socket.id, message,
        timestamp: new Date()
      });
      io.to(roomId).emit('receive_message', {
        sender: user.username, senderId: socket.id,
        color: user.color, message, timestamp: saved.timestamp
      });
    });

    socket.on('typing', ({ roomId, username }) => {
      socket.broadcast.to(roomId).emit('user_typing', { username });
    });

    socket.on('reaction', ({ emoji }) => {
      socket.broadcast.emit('reaction', { socketId: socket.id, emoji });
    });

    socket.on('hand_raise', ({ raised }) => {
      socket.broadcast.emit('hand_raise', { socketId: socket.id, raised });
    });

    // WebRTC relay
    socket.on('webrtc_signal', ({ targetSocketId, signal }) => {
      io.to(targetSocketId).emit('webrtc_signal', { senderSocketId: socket.id, signal });
    });

    socket.on('disconnect', async () => {
      console.log(`[LEAVE] ${socket.id}`);
      try {
        await User.findOneAndDelete({ socketId: socket.id });
        socket.broadcast.emit('user_left', { socketId: socket.id });
      } catch (err) {
        console.error('Disconnect cleanup error:', err);
      }
    });
  });
};
