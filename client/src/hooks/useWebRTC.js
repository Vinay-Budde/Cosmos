import { useEffect, useRef, useState, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // TURN Relay Servers (The firewall bypass)
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceTransportPolicy: 'all',
};

export function useWebRTC(socket, localStream) {
  const [remoteStreams, setRemoteStreams] = useState({});
  const [iceStates,     setIceStates]     = useState({});
  const peers       = useRef({});    // socketId → RTCPeerConnection
  const iceCandBuf  = useRef({});    // socketId → RTCIceCandidate[] (buffered before remoteDesc is set)
  const socketRef   = useRef(socket);
  const streamRef   = useRef(localStream);
  const removeRef   = useRef(null);

  // Keep refs current so callbacks always have the latest values
  useEffect(() => { socketRef.current  = socket;      }, [socket]);
  useEffect(() => { streamRef.current  = localStream; }, [localStream]);

  const removePeerConnection = useCallback((socketId) => {
    const pc = peers.current[socketId];
    if (!pc) return;
    pc.oniceconnectionstatechange = null;
    pc.onnegotiationneeded = null;
    pc.ontrack = null;
    pc.onicecandidate = null;
    pc.close();
    delete peers.current[socketId];
    delete iceCandBuf.current[socketId];
    setRemoteStreams(prev => {
      const next = { ...prev };
      delete next[socketId];
      return next;
    });
    setIceStates(prev => {
      const next = { ...prev };
      delete next[socketId];
      return next;
    });
  }, []);

  useEffect(() => { removeRef.current = removePeerConnection; }, [removePeerConnection]);

  // Drain buffered ICE candidates once a remote description is applied
  const drainCandidates = useCallback(async (pc, socketId) => {
    const buf = iceCandBuf.current[socketId];
    if (!buf || buf.length === 0) return;
    console.log(`[WebRTC] Draining ${buf.length} buffered ICE candidates for ${socketId}`);
    for (const c of buf) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch { /* ignore */ }
    }
    iceCandBuf.current[socketId] = [];
  }, []);

  const createPeerConnection = useCallback(async (targetSocketId, isInitiator) => {
    if (peers.current[targetSocketId]) return peers.current[targetSocketId];
    const sock = socketRef.current;
    if (!sock) return null;

    console.log(`[WebRTC] Creating connection to ${targetSocketId}, initiator: ${isInitiator}`);
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peers.current[targetSocketId] = pc;
    iceCandBuf.current[targetSocketId] = [];

    // Add local media tracks
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    // Send ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sock.emit('webrtc_signal', {
          targetSocketId,
          signal: { type: 'candidate', candidate: event.candidate },
        });
      }
    };

    // Renegotiation (fires when tracks are added/replaced after initial offer)
    pc.onnegotiationneeded = async () => {
      // Only the initiator should send a new offer
      if (!isInitiator) return;
      if (pc.signalingState !== 'stable') return;
      try {
        console.log(`[WebRTC] Renegotiating with ${targetSocketId}`);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sock.emit('webrtc_signal', {
          targetSocketId,
          signal: { type: 'offer', sdp: pc.localDescription },
        });
      } catch (err) {
        console.error('[WebRTC] Renegotiation offer failed:', err);
      }
    };

    // Remote stream
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Track received from ${targetSocketId}: kind=${event.track.kind}`);
      setRemoteStreams(prev => {
        const existing = prev[targetSocketId];
        // Use the stream from the event if available, otherwise build one
        const stream = event.streams[0] || existing || new MediaStream();
        if (existing && existing !== stream) {
          // Merge any new tracks into the existing stream reference so video elements update
          event.streams[0]?.getTracks().forEach(t => {
            if (!existing.getTracks().find(et => et.id === t.id)) existing.addTrack(t);
          });
          return { ...prev, [targetSocketId]: existing };
        }
        return { ...prev, [targetSocketId]: stream };
      });
    };

    // State monitoring
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      setIceStates(prev => ({ ...prev, [targetSocketId]: state }));
      console.log(`[WebRTC] ICE State for ${targetSocketId}: ${state}`);
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        removeRef.current?.(targetSocketId);
      }
    };

    // Initial offer
    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sock.emit('webrtc_signal', {
          targetSocketId,
          signal: { type: 'offer', sdp: pc.localDescription },
        });
      } catch (err) {
        console.error('[WebRTC] Offer creation failed:', err);
      }
    }

    return pc;
  }, [drainCandidates]);

  // ── Sync local stream tracks with all open peers ──────────────
  // Called whenever localStream reference changes (e.g. camera toggled on/off)
  useEffect(() => {
    if (!localStream) return;
    const tracks = localStream.getTracks();
    console.log(`[WebRTC] Local stream updated: ${tracks.length} tracks`, tracks.map(t => t.kind));

    Object.entries(peers.current).forEach(([socketId, pc]) => {
      if (pc.connectionState === 'closed') return;
      
      tracks.forEach(track => {
        const senders = pc.getSenders();
        const sender = senders.find(s => s.track?.kind === track.kind);
        
        if (sender) {
          console.log(`[WebRTC] Replacing ${track.kind} track for ${socketId}`);
          sender.replaceTrack(track).catch(e => console.warn('[WebRTC] replaceTrack error:', e));
        } else {
          console.log(`[WebRTC] Adding NEW ${track.kind} track for ${socketId}`);
          pc.addTrack(track, localStream);
          // NEW: Adding a track often needs negotiation
          // The onnegotiationneeded will fire automatically if we added a track
        }
      });
    });
  }, [localStream]);

  // ── WebRTC signaling ──────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleSignal = async ({ senderSocketId, signal }) => {
      try {
        if (signal.type === 'offer') {
          const pc = await createPeerConnection(senderSocketId, false);
          if (!pc) return;
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          await drainCandidates(pc, senderSocketId); // flush buffered candidates
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
            await drainCandidates(pc, senderSocketId); // flush buffered candidates
          }

        } else if (signal.type === 'candidate') {
          const pc = peers.current[senderSocketId];
          if (!pc) return;
          if (pc.remoteDescription && pc.remoteDescription.type) {
            // Remote desc is ready — add directly
            try {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } catch {
              console.warn('[WebRTC] addIceCandidate failed');
            }
          } else {
            // Remote desc NOT ready — buffer the candidate
            console.log(`[WebRTC] Buffering ICE candidate for ${senderSocketId}`);
            if (!iceCandBuf.current[senderSocketId]) iceCandBuf.current[senderSocketId] = [];
            iceCandBuf.current[senderSocketId].push(signal.candidate);
          }
        }
      } catch (err) {
        console.error('[WebRTC] Signal handling error:', err);
      }
    };

    socket.on('webrtc_signal', handleSignal);
    return () => socket.off('webrtc_signal', handleSignal);
  }, [socket, createPeerConnection, drainCandidates]);

  // Cleanup all peers on unmount
  useEffect(() => {
    return () => {
      Object.keys(peers.current).forEach(id => removeRef.current?.(id));
    };
  }, []);

  return { remoteStreams, iceStates, createPeerConnection, removePeerConnection };
}
