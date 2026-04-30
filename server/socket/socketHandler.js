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

    socket.on('position_update', async ({ x, y, room }) => {
      await User.findOneAndUpdate({ socketId: socket.id }, { x, y, room });
      socket.broadcast.emit('user_moved', { socketId: socket.id, x, y, room });
    });

    // Proximity signaling
    socket.on('proximity_connect', ({ targetSocketId }) => {
      io.to(targetSocketId).emit('proximity_connect', { targetSocketId: socket.id });
      socket.emit('proximity_connect', { targetSocketId });
    });

    socket.on('proximity_disconnect', ({ targetSocketId }) => {
      io.to(targetSocketId).emit('proximity_disconnect', { targetSocketId: socket.id });
      socket.emit('proximity_disconnect', { targetSocketId });
    });

    // ── Chat messages ─────────────────────────────────────────────
    socket.on('send_message', async ({ targetIds, message, roomId }) => {
      const user = await User.findOne({ socketId: socket.id });
      if (!user) {
        // Fallback: still allow sending even without DB record
        console.warn(`[MSG] No DB record for socket ${socket.id}, message dropped.`);
        return;
      }

      const timestamp = new Date();
      const payload = {
        sender:   user.username,
        senderId: socket.id,
        color:    user.color,
        message,
        timestamp,
        roomId: roomId || null,
      };

      if (roomId) {
        // ── General/Room chat: save to DB, broadcast to ALL ──
        try {
          await Message.create({
            roomId,
            sender:   user.username,
            senderId: socket.id,
            message,
            timestamp,
          });
        } catch (dbErr) {
          console.error("Message save error:", dbErr);
        }
        // Broadcast to everyone in the space (including sender so their ChatPanel updates)
        io.emit('receive_message', payload);

      } else {
        // ── Proximity/directed chat: send to sender + target IDs only ──
        socket.emit('receive_message', payload); // echo to sender
        if (Array.isArray(targetIds) && targetIds.length > 0) {
          targetIds.forEach(id => io.to(id).emit('receive_message', payload));
        }
      }
    });

    socket.on('typing', ({ targetIds, username }) => {
      if (Array.isArray(targetIds)) {
        targetIds.forEach(id => io.to(id).emit('user_typing', { username }));
      }
    });

    socket.on('reaction', ({ emoji }) => {
      socket.broadcast.emit('reaction', { socketId: socket.id, emoji });
    });

    socket.on('hand_raise', ({ raised }) => {
      socket.broadcast.emit('hand_raise', { socketId: socket.id, raised });
    });

    socket.on('media_status_update', async ({ micOn, cameraOn }) => {
      try {
        await User.findOneAndUpdate({ socketId: socket.id }, { micOn, cameraOn });
      } catch (err) {
        console.error("Error updating media status in DB:", err);
      }
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
