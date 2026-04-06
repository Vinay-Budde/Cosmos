import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import CosmosCanvas from './CosmosCanvas';
import TopBar from './TopBar';
import LeftSidebar from './LeftSidebar';
import BottomBar from './BottomBar';
import ChatSidebar from './ChatSidebar';
import FloatingCallUI from './FloatingCallUI';
import FloatingReaction from './FloatingReaction';
import MobileControls from './MobileControls';
import { useWebRTC } from '../hooks/useWebRTC';
import { initializeKeyboard } from '../hooks/useMovement';
import { Plus, Minus, Map } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
console.log(`[Cosmos] Connecting to backend: ${SOCKET_URL}`);
const SPAWN_X = 35 * 32;
const SPAWN_Y = 32 * 32;

export default function CosmosView({
  playerInfo, localStream, micOn, cameraOn, toggleMic, toggleCamera
}) {
  const [socket,          setSocket]          = useState(null);
  const [otherUsers,      setOtherUsers]      = useState([]);
  const [chatOpen,        setChatOpen]        = useState(false);
  const [messages,        setMessages]        = useState([]);
  const [typingUsers,     setTypingUsers]     = useState([]);
  const [localRoom,       setLocalRoom]       = useState('Spatial');
  const [nearbyIds,       setNearbyIds]       = useState([]);
  const [reactions,       setReactions]       = useState([]);
  const [handRaisedBy,    setHandRaisedBy]    = useState(new Set());
  const [isConnected,     setIsConnected]     = useState(false);
  const [zoom,            setZoom]            = useState(1.0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { remoteStreams, iceStates, createPeerConnection, removePeerConnection } = useWebRTC(socket, localStream);

  // ── Socket setup ──────────────────────────────────────────────
  useEffect(() => {
    const cleanupKeyboard = initializeKeyboard();
    const s = io(SOCKET_URL, { transports: ['websocket'] });
    setSocket(s);

    s.on('connect', () => {
      console.log(`[Cosmos] Connected to server! ID: ${s.id}`);
      setIsConnected(true);
      s.emit('join_cosmos', {
        username: playerInfo.name,
        color:    playerInfo.color,
        x: SPAWN_X,
        y: SPAWN_Y,
        micOn,
        cameraOn
      });
    });

    s.on('connect_error', (err) => {
      console.error('[Cosmos] Connection Error:', err.message);
      setIsConnected(false);
    });

    s.on('disconnect', () => {
      console.log('[Cosmos] Disconnected from server');
      setIsConnected(false);
    });

    s.on('all_users',   (users) => {
      setOtherUsers(users);
      // Initialize handRaisedBy from initial list
      const initialRaised = new Set(users.filter(u => u.handRaised).map(u => u.socketId));
      setHandRaisedBy(initialRaised);
    });
    s.on('user_joined', (user)  => {
      setOtherUsers(prev => {
        if (prev.some(u => u.socketId === user.socketId)) return prev;
        return [...prev, user];
      });
      if (user.handRaised) {
        setHandRaisedBy(prev => new Set(prev).add(user.socketId));
      }
    });
    s.on('media_status_update', ({ socketId, micOn, cameraOn }) => {
      setOtherUsers(prev => prev.map(u => u.socketId === socketId ? { ...u, micOn, cameraOn } : u));
    });

    s.on('user_moved',  ({ socketId, x, y, room, micOn, cameraOn }) =>
      setOtherUsers(prev => prev.map(u => u.socketId === socketId ? { ...u, x, y, room, micOn, cameraOn } : u))
    );
    s.on('user_left', ({ socketId }) => {
      setOtherUsers(prev => prev.filter(u => u.socketId !== socketId));
      removePeerConnection(socketId);
      setHandRaisedBy(prev => { const n = new Set(prev); n.delete(socketId); return n; });
    });

    // Proximity-based WebRTC
    s.on('proximity_connect', ({ targetSocketId }) => {
      // Tie-breaker: decide who initiates based on socket.id comparison
      const isInitiator = s.id > targetSocketId;
      console.log(`[WebRTC] Proximity match with ${targetSocketId}. I am initiator: ${isInitiator}`);
      createPeerConnection(targetSocketId, isInitiator);
    });
    s.on('proximity_disconnect', ({ targetSocketId }) => removePeerConnection(targetSocketId));

    // Chat
    s.on('receive_message', (msg) => setMessages(prev => [...prev, msg]));
    s.on('user_typing', ({ username }) => {
      setTypingUsers(prev => prev.includes(username) ? prev : [...prev, username]);
      setTimeout(() => setTypingUsers(prev => prev.filter(u => u !== username)), 2500);
    });

    // Reactions — show floating emoji on map
    s.on('reaction', ({ socketId, emoji }) => {
      const id = `${socketId}_${Date.now()}`;
      setReactions(prev => [...prev, { id, emoji, socketId }]);
      setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 3000);
    });

    // Hand raise
    s.on('hand_raise', ({ socketId, raised }) => {
      setHandRaisedBy(prev => {
        const n = new Set(prev);
        raised ? n.add(socketId) : n.delete(socketId);
        return n;
      });
    });

    return () => { s.disconnect(); cleanupKeyboard(); };
  }, [playerInfo]);

  // Broadcast media status changes
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('media_status_update', { micOn, cameraOn });
    }
  }, [micOn, cameraOn, isConnected, socket]);

  const handleZoom = (delta) =>
    setZoom(prev => parseFloat(Math.min(2.0, Math.max(0.1, prev + delta)).toFixed(2)));

  const myUserObj = {
    socketId: socket?.id,
    username: playerInfo.name,
    color:    playerInfo.color,
    room:     localRoom,
  };

  const activeParticipants = otherUsers.filter(u => nearbyIds.includes(u.socketId));
  const chatPartner = activeParticipants[0] || null;
  const hasNearby   = nearbyIds.length > 0;

  // Auto-open/close chat on proximity change
  useEffect(() => {
    setChatOpen(nearbyIds.length > 0);
  }, [nearbyIds.length]);

  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);

  // ── Connection Timeout Monitoring ─────────────────────────────
  useEffect(() => {
    let timer;
    if (!isConnected) {
      timer = setTimeout(() => setShowTimeoutMessage(true), 7000);
    } else {
      setShowTimeoutMessage(false);
    }
    return () => clearTimeout(timer);
  }, [isConnected]);

  return (
    <div className="w-full h-screen bg-[#111120] overflow-hidden relative flex flex-col font-sans text-white">
      {/* Loading Overlay */}
      {!isConnected && (
        <div className="fixed inset-0 z-[20000] bg-[#111120] flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-emerald-500/20 rounded-full border-t-emerald-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-full animate-ping" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-black tracking-widest uppercase">Joining Cosmos</h2>
            <p className="text-slate-400 text-sm font-medium animate-pulse">Connecting to server...</p>
            
            {/* Troubleshooting message */}
            {showTimeoutMessage && (
              <div className="mt-8 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
                <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-xs text-center max-w-[280px]">
                  Taking longer than usual? Check your internet connection or try refreshing.
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all"
                >
                  Refresh Page
                </button>
              </div>
            )}
          </div>
          <div className="absolute bottom-12 flex flex-col items-center gap-3">
             <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">Synchronizing Real-time Engine</p>
             <div className="flex gap-1">
                {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500/30 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
             </div>
          </div>
        </div>
      )}

      <TopBar
        onlineCount={otherUsers.length + 1}
        hasNearby={hasNearby}
        localRoom={localRoom}
        isConnected={isConnected}
        onMenuToggle={() => setMobileSidebarOpen(prev => !prev)}
      />

      <div className="flex-1 flex overflow-hidden mt-[44px] mb-[70px]">
        <LeftSidebar
          myUser={myUserObj}
          otherUsers={otherUsers}
          handRaisedBy={handRaisedBy}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        <div className="flex-1 relative overflow-hidden">
          {socket && (
            <CosmosCanvas
              socket={socket}
              playerInfo={playerInfo}
              otherUsers={otherUsers}
              setLocalRoom={setLocalRoom}
              setNearbyUsers={(ids) => {
                setNearbyIds(ids);
                if (ids.length === 0) setChatOpen(false);
              }}
              zoom={zoom}
              handRaisedBy={handRaisedBy}
            />
          )}

          {/* Floating reaction emojis */}
          {reactions.map(r => (
            <FloatingReaction key={r.id} emoji={r.emoji} />
          ))}

          {/* Mobile D-pad touch controls */}
          <MobileControls />

          {/* Zoom Controls */}
          <div className="absolute right-5 top-1/2 -translate-y-1/2 z-40">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center overflow-hidden">
              <button onClick={() => handleZoom(0.1)}
                className="p-3 hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-900">
                <Plus size={18} strokeWidth={3} />
              </button>
              <div className="w-full h-px bg-slate-100" />
              <span className="px-3 py-1.5 text-[12px] font-black text-slate-800 tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <div className="w-full h-px bg-slate-100" />
              <button onClick={() => handleZoom(-0.1)}
                className="p-3 hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-900">
                <Minus size={18} strokeWidth={3} />
              </button>
              <div className="w-full h-px bg-slate-100" />
              <button onClick={() => setZoom(0.19)} title="Full map overview (19%)"
                className="p-3 hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-700">
                <Map size={16} />
              </button>
            </div>
          </div>

          {/* Floating video call UI when nearby */}
          {hasNearby && (
            <FloatingCallUI
              myUser={myUserObj}
              participants={activeParticipants}
              localStream={localStream}
              remoteStreams={remoteStreams}
              iceStates={iceStates}
              micOn={micOn}
              cameraOn={cameraOn}
            />
          )}
        </div>

        <ChatSidebar
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          socket={socket}
          myUser={myUserObj}
          messages={messages}
          typingUsers={typingUsers}
          hasNearby={hasNearby}
          nearbyUsers={activeParticipants}
          partner={chatPartner}
        />
      </div>

      <BottomBar
        myUser={myUserObj}
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        socket={socket}
        micOn={micOn}
        cameraOn={cameraOn}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        hasNearby={hasNearby}
        localStream={localStream}
      />
    </div>
  );
}
