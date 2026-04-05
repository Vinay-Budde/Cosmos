import { useEffect } from 'react';
import { calculateDistance, PROXIMITY_RADIUS } from '../utils/proximity';

export function useProximity(myUser, otherUsers, socket, onConnect, onDisconnect) {
  useEffect(() => {
    if (!myUser || !socket) return;

    // find nearest user in radius
    let nearestUser = null;
    let minDistance = Infinity;

    otherUsers.forEach(u => {
      const dist = calculateDistance(myUser.x, myUser.y, u.x, u.y);
      if (dist <= PROXIMITY_RADIUS && dist < minDistance) {
        minDistance = dist;
        nearestUser = u;
      }
    });

    if (nearestUser) {
      if (myUser.connectedTo !== nearestUser.socketId) {
        socket.emit('proximity_connect', { targetSocketId: nearestUser.socketId });
        onConnect(nearestUser);
      }
    } else {
      if (myUser.connectedTo) {
        socket.emit('proximity_disconnect', { targetSocketId: myUser.connectedTo });
        onDisconnect();
      }
    }
  }, [myUser?.x, myUser?.y, otherUsers]); 
}
