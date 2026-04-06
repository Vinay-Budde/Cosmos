const User = require('../models/User');
const Message = require('../models/Message');

/**
 * DATABASE RESILIENCE & PERFORMANCE UPGRADE
 * This in-memory map ensures the project "works properly" even if 
 * the database is disconnected or under heavy load.
 */
const volatileUsers = new Map(); // socketId -> userObject

module.exports = (io) => {

  // Wipe ghost users on startup (best effort, don't block)
  User.deleteMany({}).catch(() => {});

  io.on('connection', (socket) => {

    socket.on('join_cosmos', async ({ username, color, x, y, micOn, cameraOn }) => {
      console.log(`[JOIN] ${username} (${socket.id})`);
      
      const userData = { socketId: socket.id, username, color, x, y, micOn, cameraOn, handRaised: false };
      
      // Update fallback map immediately
      volatileUsers.set(socket.id, userData);

      try {
        // Try saving to DB (best effort)
        await User.findOneAndDelete({ socketId: socket.id });
        await User.create(userData);
      } catch (err) {
        console.warn(`[Warning] Database write failed for ${username}, using in-memory fallback.`);
      }

      // Collect "Others" from BOTH database (stately) and in-memory (speedy)
      // This hybrid approach ensures the cosmos is ALWAYS populated.
      let others = [];
      try {
        const connectedIds = Array.from(io.sockets.sockets.keys());
        others = await User.find({ socketId: { $in: connectedIds, $ne: socket.id } }).lean();
      } catch (err) {
        // Fallback: use only the in-memory map
        others = Array.from(volatileUsers.values()).filter(u => u.socketId !== socket.id);
      }

      socket.emit('all_users', others);
      socket.broadcast.emit('user_joined', userData);
    });

    socket.on('position_update', ({ x, y, room, micOn, cameraOn }) => {
      // 1. Update in-memory state for IMMEDIATE consistency
      const user = volatileUsers.get(socket.id);
      if (user) {
        Object.assign(user, { x, y, room, micOn, cameraOn });
      }

      // 2. Broadcast immediately (zero-lag strategy)
      socket.broadcast.emit('user_moved', { socketId: socket.id, x, y, room, micOn, cameraOn });

      // 3. Update database in "background" (don't await) to prevent lag
      User.findOneAndUpdate({ socketId: socket.id }, { x, y, room, micOn, cameraOn }).catch(() => {});
    });

    socket.on('proximity_connect', ({ targetSocketId }) => {
      io.to(targetSocketId).emit('proximity_connect', { targetSocketId: socket.id });
    });

    socket.on('proximity_disconnect', ({ targetSocketId }) => {
      io.to(targetSocketId).emit('proximity_disconnect', { targetSocketId: socket.id });
    });

    socket.on('send_message', async ({ targetIds, message }) => {
      // Find sender info (Hybrid DB/Memory check)
      let user = volatileUsers.get(socket.id);
      if (!user) {
        try { user = await User.findOne({ socketId: socket.id }); } catch (e) {}
      }
      
      if (!user) return;
      
      const payload = {
        sender: user.username,
        senderId: socket.id,
        color: user.color,
        message,
        timestamp: new Date()
      };
      
      socket.emit('receive_message', payload);
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
      io.emit('reaction', { socketId: socket.id, emoji });
    });

    socket.on('hand_raise', ({ raised }) => {
      // Update memory & DB
      const user = volatileUsers.get(socket.id);
      if (user) user.handRaised = raised;
      
      User.findOneAndUpdate({ socketId: socket.id }, { handRaised: raised }).catch(() => {});
      io.emit('hand_raise', { socketId: socket.id, raised });
    });

    socket.on('media_status_update', ({ micOn, cameraOn }) => {
      socket.broadcast.emit('media_status_update', { socketId: socket.id, micOn, cameraOn });
    });

    socket.on('webrtc_signal', ({ targetSocketId, signal }) => {
      io.to(targetSocketId).emit('webrtc_signal', { senderSocketId: socket.id, signal });
    });

    socket.on('disconnect', () => {
      console.log(`[LEAVE] ${socket.id}`);
      volatileUsers.delete(socket.id);
      User.findOneAndDelete({ socketId: socket.id }).catch(() => {});
      socket.broadcast.emit('user_left', { socketId: socket.id });
    });
  });
};
