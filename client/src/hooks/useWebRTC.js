import { useEffect, useRef, useState, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export function useWebRTC(socket, localStream) {
  const [remoteStreams, setRemoteStreams] = useState({});
  const [iceStates,     setIceStates]     = useState({}); // socketId → iceConnectionState
  const peers = useRef({}); // socketId → RTCPeerConnection

  // Use a ref so removePeerConnection can be called inside oniceconnectionstatechange
  // without capturing a stale closure
  const removeRef = useRef(null);

  const removePeerConnection = useCallback((socketId) => {
    const pc = peers.current[socketId];
    if (!pc) return;
    pc.oniceconnectionstatechange = null;
    pc.ontrack = null;
    pc.onicecandidate = null;
    pc.close();
    delete peers.current[socketId];
    setRemoteStreams(prev => {
      const next = { ...prev };
      delete next[socketId];
      return next;
    });
  }, []);

  // Keep ref in sync
  useEffect(() => { removeRef.current = removePeerConnection; }, [removePeerConnection]);

  const createPeerConnection = useCallback(async (targetSocketId, isInitiator) => {
    // Prevent duplicate connections
    if (peers.current[targetSocketId]) return peers.current[targetSocketId];
    if (!socket) return null;

    console.log(`[WebRTC] Connecting to ${targetSocketId}, initiator: ${isInitiator}`);
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peers.current[targetSocketId] = pc;

    // Add local media tracks
    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc_signal', {
          targetSocketId,
          signal: { type: 'candidate', candidate: event.candidate },
        });
      }
    };

    // Remote stream
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Track received from ${targetSocketId}: ${event.track.kind}`);
      setRemoteStreams(prev => {
        const stream = prev[targetSocketId] || new MediaStream();
        // Add new track if not already present
        if (!stream.getTracks().find(t => t.id === event.track.id)) {
          stream.addTrack(event.track);
        }
        return { ...prev, [targetSocketId]: stream };
      });
    };

    // Auto-cleanup if connection drops
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      setIceStates(prev => ({ ...prev, [targetSocketId]: state }));
      console.log(`[WebRTC] ICE State for ${targetSocketId}: ${state}`);
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        removeRef.current?.(targetSocketId);
      }
    };

    // Create and send offer if we're the initiator
    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc_signal', {
          targetSocketId,
          signal: { type: 'offer', sdp: pc.localDescription },
        });
      } catch (err) {
        console.error('[WebRTC] Offer creation failed:', err);
      }
    }

    return pc;
  }, [socket, localStream]);

  // Sync local stream tracks with all open peers (e.g. when camera toggled on)
  useEffect(() => {
    if (!localStream) return;
    Object.entries(peers.current).forEach(([, pc]) => {
      localStream.getTracks().forEach(track => {
        const sender = pc.getSenders().find(s => s.track?.kind === track.kind);
        if (sender) sender.replaceTrack(track);
        else pc.addTrack(track, localStream);
      });
    });
  }, [localStream]);

  // WebRTC signaling via socket
  useEffect(() => {
    if (!socket) return;

    const handleSignal = async ({ senderSocketId, signal }) => {
      try {
        if (signal.type === 'offer') {
          const pc = await createPeerConnection(senderSocketId, false);
          if (!pc) return;
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc_signal', {
            targetSocketId: senderSocketId,
            signal: { type: 'answer', sdp: pc.localDescription },
          });

        } else if (signal.type === 'answer') {
          const pc = peers.current[senderSocketId];
          if (pc && pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          }

        } else if (signal.type === 'candidate') {
          const pc = peers.current[senderSocketId];
          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } else if (pc) {
            // Buffer candidate if needed, but for now we just log
            console.log('[WebRTC] Buffering/ignoring candidate (remoteDesc not set)');
          }
        }
      } catch (err) {
        console.error('[WebRTC] Signal handling error:', err);
      }
    };

    socket.on('webrtc_signal', handleSignal);
    return () => socket.off('webrtc_signal', handleSignal);
  }, [socket, createPeerConnection]);

  // Cleanup all peers on unmount
  useEffect(() => {
    return () => {
      Object.keys(peers.current).forEach(id => removeRef.current?.(id));
    };
  }, []);

  return { remoteStreams, iceStates, createPeerConnection, removePeerConnection };
}
