const User = require('../models/User');
const Message = require('../models/Message');

module.exports = (io) => {

  // ── On server start, wipe all stale user records ──────────────
  // Any user in the DB from a previous server session is a ghost
  User.deleteMany({}).catch(err => console.error('User table clear error:', err));

  io.on('connection', (socket) => {

    socket.on('join_cosmos', async ({ username, color, x, y, micOn, cameraOn }) => {
      console.log(`[JOIN] ${username} (${socket.id})`);

      // Remove any existing record for this exact socket (duplicate join guard)
      await User.findOneAndDelete({ socketId: socket.id });

      // Create fresh record
      await User.create({ socketId: socket.id, username, color, x, y, micOn, cameraOn });

      // Only return users whose socket IDs are actively connected RIGHT NOW
      const connectedIds = Array.from(io.sockets.sockets.keys());
      const others = await User.find({
        socketId: { $in: connectedIds, $ne: socket.id }
      });

      socket.emit('all_users', others);
      socket.broadcast.emit('user_joined', {
        socketId: socket.id, username, color, x, y, micOn, cameraOn
      });
    });

    socket.on('position_update', async ({ x, y, room, micOn, cameraOn }) => {
      await User.findOneAndUpdate({ socketId: socket.id }, { x, y, room, micOn, cameraOn });
      socket.broadcast.emit('user_moved', { socketId: socket.id, x, y, room, micOn, cameraOn });
    });

    // Proximity signaling
    socket.on('proximity_connect', ({ targetSocketId }) => {
      io.to(targetSocketId).emit('proximity_connect', { targetSocketId: socket.id });
    });

    socket.on('proximity_disconnect', ({ targetSocketId }) => {
      io.to(targetSocketId).emit('proximity_disconnect', { targetSocketId: socket.id });
    });

    // Chat messages (Directed to nearby users)
    socket.on('send_message', async ({ targetIds, message }) => {
      const user = await User.findOne({ socketId: socket.id });
      if (!user) return;
      const timestamp = new Date();
      const payload = {
        sender: user.username,
        senderId: socket.id,
        color: user.color,
        message,
        timestamp
      };
      // Send to self
      socket.emit('receive_message', payload);
      // Send to all nearby targets
      if (Array.isArray(targetIds)) {
        targetIds.forEach(id => io.to(id).emit('receive_message', payload));
      }
    });

    socket.on('typing', ({ targetIds, username }) => {
      if (Array.isArray(targetIds)) {
        targetIds.forEach(id => io.to(id).emit('user_typing', { username }));
      }
    });

    socket.on('reaction', ({ emoji }) => {
      // Use io.emit so everyone, including the sender, receives it and sees the floating reaction
      io.emit('reaction', { socketId: socket.id, emoji });
    });

    socket.on('hand_raise', async ({ raised }) => {
      await User.findOneAndUpdate({ socketId: socket.id }, { handRaised: raised });
      // Use io.emit so everyone's sidebar and map updates correctly
      io.emit('hand_raise', { socketId: socket.id, raised });
    });

    socket.on('media_status_update', ({ micOn, cameraOn }) => {
      socket.broadcast.emit('media_status_update', { socketId: socket.id, micOn, cameraOn });
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
