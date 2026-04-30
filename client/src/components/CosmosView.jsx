import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import CosmosCanvas from './CosmosCanvas';
import TopBar from './TopBar';
import LeftSidebar from './LeftSidebar';
import BottomBar from './BottomBar';
import ChatSidebar from './ChatSidebar';
import ChatPanel from './ChatPanel';
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
  const [globalChatOpen,  setGlobalChatOpen]  = useState(false);
  const [messages,        setMessages]        = useState([]);  // proximity-only
  const [typingUsers,     setTypingUsers]     = useState([]);
  const [localRoom,       setLocalRoom]       = useState('Spatial');
  const [nearbyIds,       setNearbyIds]       = useState([]);
  const [reactions,       setReactions]       = useState([]);
  const [handRaisedBy,    setHandRaisedBy]    = useState(new Set());
  const [isConnected,     setIsConnected]     = useState(false);
  const [zoom,            setZoom]            = useState(1.0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDeafened,        setDeafened]          = useState(false);

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

    s.on('all_users',   (users) => setOtherUsers(users));
    s.on('user_joined', (user)  => setOtherUsers(prev => {
      if (prev.some(u => u.socketId === user.socketId)) return prev;
      return [...prev, user];
    }));
    s.on('media_status_update', ({ socketId, micOn, cameraOn }) => {
      setOtherUsers(prev => prev.map(u => u.socketId === socketId ? { ...u, micOn, cameraOn } : u));
    });

    s.on('user_moved',  ({ socketId, x, y, room }) =>
      setOtherUsers(prev => prev.map(u => u.socketId === socketId ? { ...u, x, y, room } : u))
    );
    s.on('user_left', ({ socketId }) => {
      setOtherUsers(prev => prev.filter(u => u.socketId !== socketId));
      removePeerConnection(socketId);
      setHandRaisedBy(prev => { const n = new Set(prev); n.delete(socketId); return n; });
    });

    // Proximity-based WebRTC
    s.on('proximity_connect', ({ targetSocketId }) => {
      const isInitiator = s.id > targetSocketId;
      console.log(`[WebRTC] Proximity match with ${targetSocketId}. I am initiator: ${isInitiator}`);
      createPeerConnection(targetSocketId, isInitiator);
    });
    s.on('proximity_disconnect', ({ targetSocketId }) => removePeerConnection(targetSocketId));

    // ── Chat: ONLY add to proximity messages if it has NO roomId ──
    // General chat (roomId='general') is handled entirely by ChatPanel's own socket listener
    s.on('receive_message', (msg) => {
      if (!msg.roomId) {
        // Proximity/direct message — add to sidebar
        setMessages(prev => [...prev, msg]);
      }
      // Messages with roomId are intentionally NOT added here —
      // ChatPanel has its own dedicated socket.on('receive_message') listener
      // that handles filtering by roomId itself.
    });

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
  }, [playerInfo]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Auto-open proximity chat on entering range, auto-close on leaving
  useEffect(() => {
    if (nearbyIds.length > 0) {
      setChatOpen(true);
    } else {
      setChatOpen(false);
    }
  }, [nearbyIds.length]);

  // Mutual exclusion: closing one panel doesn't open the other
  const openGeneralChat = () => {
    setGlobalChatOpen(true);
    setChatOpen(false);
    setMobileSidebarOpen(false);
  };

  const openProximityChat = () => {
    if (!hasNearby) return;
    setChatOpen(prev => !prev);
    setGlobalChatOpen(false);
  };

  return (
    <div className="w-full h-screen bg-[#111120] overflow-hidden relative flex flex-col font-sans text-white">
      <TopBar
        onlineCount={otherUsers.length + 1}
        hasNearby={hasNearby}
        localRoom={localRoom}
        isConnected={isConnected}
        onMenuToggle={() => setMobileSidebarOpen(prev => !prev)}
        isDeafened={isDeafened}
        toggleDeafen={() => setDeafened(prev => !prev)}
      />

      <div className="flex-1 flex overflow-hidden mt-[44px] mb-[70px]">
        <LeftSidebar
          myUser={myUserObj}
          otherUsers={otherUsers}
          handRaisedBy={handRaisedBy}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
          onOpenGeneralChat={openGeneralChat}
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
              isDeafened={isDeafened}
            />
          )}
        </div>

        {/* Proximity Chat Sidebar */}
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

        {/* General Chat Panel — mobile backdrop */}
        {globalChatOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-[400] backdrop-blur-sm"
            onClick={() => setGlobalChatOpen(false)}
          />
        )}

        {/* General Chat Panel */}
        <div
          className={`
            bg-white flex flex-col z-[500] shadow-2xl overflow-hidden
            md:relative md:h-full md:transition-all md:duration-300 md:ease-in-out md:shrink-0
            fixed left-0 right-0 bottom-0 transition-all duration-300 ease-in-out
            rounded-t-2xl md:rounded-none
            ${globalChatOpen
              ? 'md:w-[320px] md:min-w-[320px] md:border-l md:border-gray-200 top-[10%] md:top-auto'
              : 'md:w-0 md:min-w-0 md:border-none top-full md:top-auto'
            }
          `}
          style={{ borderLeft: 'none' }}
        >
          {globalChatOpen && (
            <ChatPanel
              roomId="general"
              socket={socket}
              myUser={myUserObj}
              onClose={() => setGlobalChatOpen(false)}
            />
          )}
        </div>
      </div>

      <BottomBar
        myUser={myUserObj}
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        globalChatOpen={globalChatOpen}
        onOpenGeneralChat={openGeneralChat}
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
