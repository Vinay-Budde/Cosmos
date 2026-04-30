import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { ROOMS, TILE_SIZE } from '../utils/mapLayout';
import SearchModal from './SearchModal';
import { Plus, Minus, Map } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const SPAWN_X = 35 * 32;
const SPAWN_Y = 32 * 32;

const MAX_ACTIVITIES = 50;

function nowStr() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function CosmosView({
  playerInfo, localStream, micOn, cameraOn, toggleMic, toggleCamera
}) {
  const [socket,            setSocket]            = useState(null);
  const [otherUsers,        setOtherUsers]        = useState([]);
  const [chatOpen,          setChatOpen]          = useState(false);
  const [channelOpen,       setChannelOpen]       = useState(false);
  const [activeChannelId,   setActiveChannelId]   = useState('general');
  const [messages,          setMessages]          = useState([]);
  const [typingUsers,       setTypingUsers]       = useState([]);
  const [localRoom,         setLocalRoom]         = useState('Spatial');
  const [nearbyIds,         setNearbyIds]         = useState([]);
  const [reactions,         setReactions]         = useState([]);
  const [handRaisedBy,      setHandRaisedBy]      = useState(new Set());
  const [isConnected,       setIsConnected]       = useState(false);
  const [zoom,              setZoom]              = useState(1.0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDeafened,        setDeafened]          = useState(false);
  // New: activity feed & recent conversations
  const [activities,          setActivities]          = useState([]);
  const [recentConversations, setRecentConversations] = useState([]);
  const [searchOpen,          setSearchOpen]          = useState(false);

  // Teleport function ref — set by CosmosCanvas
  const teleportFnRef = useRef(null);

  const { remoteStreams, iceStates, createPeerConnection, removePeerConnection } = useWebRTC(socket, localStream);

  // Cmd+K / Ctrl+K global search shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const addActivity = useCallback((icon, text, color) => {
    setActivities(prev => {
      const entry = { icon, text, color, timeStr: nowStr(), id: Date.now() + Math.random() };
      const next = [...prev, entry];
      return next.length > MAX_ACTIVITIES ? next.slice(-MAX_ACTIVITIES) : next;
    });
  }, []);

  // ── Socket setup ──────────────────────────────────────────────
  useEffect(() => {
    const cleanupKeyboard = initializeKeyboard();
    const s = io(SOCKET_URL, { transports: ['websocket'] });
    setSocket(s);

    s.on('connect', () => {
      setIsConnected(true);
      s.emit('join_cosmos', {
        username: playerInfo.name, color: playerInfo.color,
        x: SPAWN_X, y: SPAWN_Y, micOn, cameraOn
      });
    });

    s.on('connect_error', () => setIsConnected(false));
    s.on('disconnect',    () => setIsConnected(false));

    s.on('all_users', (users) => setOtherUsers(users));

    s.on('user_joined', (user) => {
      setOtherUsers(prev => {
        if (prev.some(u => u.socketId === user.socketId)) return prev;
        return [...prev, user];
      });
      addActivity('👋', `${user.username} joined the space`, user.color);
    });

    s.on('media_status_update', ({ socketId, micOn, cameraOn }) => {
      setOtherUsers(prev => prev.map(u => u.socketId === socketId ? { ...u, micOn, cameraOn } : u));
    });

    s.on('user_moved', ({ socketId, x, y, room }) =>
      setOtherUsers(prev => prev.map(u => u.socketId === socketId ? { ...u, x, y, room } : u))
    );

    s.on('user_left', ({ socketId }) => {
      setOtherUsers(prev => {
        const leaving = prev.find(u => u.socketId === socketId);
        if (leaving) addActivity('👋', `${leaving.username} left the space`, leaving.color);
        return prev.filter(u => u.socketId !== socketId);
      });
      removePeerConnection(socketId);
      setHandRaisedBy(prev => { const n = new Set(prev); n.delete(socketId); return n; });
    });

    // Proximity WebRTC
    s.on('proximity_connect', ({ targetSocketId }) => {
      const isInitiator = s.id > targetSocketId;
      createPeerConnection(targetSocketId, isInitiator);
    });
    s.on('proximity_disconnect', ({ targetSocketId }) => removePeerConnection(targetSocketId));

    // Chat — proximity only (no roomId)
    s.on('receive_message', (msg) => {
      if (!msg.roomId) setMessages(prev => [...prev, msg]);
    });

    s.on('user_typing', ({ username }) => {
      setTypingUsers(prev => prev.includes(username) ? prev : [...prev, username]);
      setTimeout(() => setTypingUsers(prev => prev.filter(u => u !== username)), 2500);
    });

    // Reactions
    s.on('reaction', ({ socketId, emoji }) => {
      const id = `${socketId}_${Date.now()}`;
      setReactions(prev => [...prev, { id, emoji, socketId }]);
      setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 3000);
      // Find who reacted
      setOtherUsers(prev => {
        const reactor = prev.find(u => u.socketId === socketId);
        if (reactor) addActivity(emoji, `${reactor.username} reacted ${emoji}`, reactor.color);
        return prev;
      });
    });

    // Hand raise
    s.on('hand_raise', ({ socketId, raised }) => {
      setHandRaisedBy(prev => {
        const n = new Set(prev);
        raised ? n.add(socketId) : n.delete(socketId);
        return n;
      });
      setOtherUsers(prev => {
        const user = prev.find(u => u.socketId === socketId);
        if (user) addActivity(raised ? '✋' : '👇', `${user.username} ${raised ? 'raised their hand' : 'lowered their hand'}`, user.color);
        return prev;
      });
    });

    return () => { s.disconnect(); cleanupKeyboard(); };
  }, [playerInfo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Broadcast media changes
  useEffect(() => {
    if (socket && isConnected) socket.emit('media_status_update', { micOn, cameraOn });
  }, [micOn, cameraOn, isConnected, socket]);

  // Track recent proximity conversations
  useEffect(() => {
    if (nearbyIds.length > 0) {
      const nearbyUsers = otherUsers.filter(u => nearbyIds.includes(u.socketId));
      setRecentConversations(prev => {
        const merged = [...nearbyUsers, ...prev.filter(p => !nearbyUsers.find(n => n.socketId === p.socketId))];
        return merged.slice(0, 8);
      });
    }
  }, [nearbyIds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto open/close proximity chat
  useEffect(() => {
    setChatOpen(nearbyIds.length > 0);
  }, [nearbyIds.length]);

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

  // ── Channel open/close ────────────────────────────────────────
  const openChannel = useCallback((channelId) => {
    setActiveChannelId(channelId);
    setChannelOpen(true);
    setChatOpen(false);
    setMobileSidebarOpen(false);
  }, []);

  const openGeneralChat = useCallback(() => openChannel('general'), [openChannel]);

  // ── Room teleport ─────────────────────────────────────────────
  const teleportToRoom = useCallback((roomId) => {
    const room = ROOMS.find(r => r.id === roomId);
    if (!room || !teleportFnRef.current) return;
    const cx = ((room.x1 + room.x2) / 2) * TILE_SIZE;
    const cy = ((room.y1 + room.y2) / 2) * TILE_SIZE;
    teleportFnRef.current(cx, cy);
    addActivity('🚀', `You teleported to ${roomId}`, playerInfo.color);
  }, [playerInfo.color, addActivity]);

  const CHANNEL_LABELS = {
    'general':            '#general-chat',
    'doubts-discussions': '#doubts-discussions',
    'threads':            '#threads',
  };

  return (
    <div className="w-full h-screen bg-[#111120] overflow-hidden relative flex flex-col font-sans text-white">
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        otherUsers={otherUsers}
        myUser={myUserObj}
        onOpenChannel={openChannel}
        onTeleportToRoom={teleportToRoom}
      />
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
          onOpenChannel={openChannel}
          onTeleportToRoom={teleportToRoom}
          activities={activities}
          recentConversations={recentConversations}
          onSearchOpen={() => setSearchOpen(true)}
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
              onTeleportReady={(fn) => { teleportFnRef.current = fn; }}
            />
          )}

          {reactions.map(r => <FloatingReaction key={r.id} emoji={r.emoji} />)}
          <MobileControls />

          {/* Zoom Controls */}
          <div className="absolute right-5 top-1/2 -translate-y-1/2 z-40">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center overflow-hidden">
              <button onClick={() => handleZoom(0.1)} className="p-3 hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-900">
                <Plus size={18} strokeWidth={3} />
              </button>
              <div className="w-full h-px bg-slate-100" />
              <span className="px-3 py-1.5 text-[12px] font-black text-slate-800 tabular-nums">{Math.round(zoom * 100)}%</span>
              <div className="w-full h-px bg-slate-100" />
              <button onClick={() => handleZoom(-0.1)} className="p-3 hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-900">
                <Minus size={18} strokeWidth={3} />
              </button>
              <div className="w-full h-px bg-slate-100" />
              <button onClick={() => setZoom(0.19)} title="Overview" className="p-3 hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-700">
                <Map size={16} />
              </button>
            </div>
          </div>

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

        {/* Channel Chat Panel (general / doubts / threads) */}
        {channelOpen && (
          <div className="md:hidden fixed inset-0 bg-black/40 z-[400] backdrop-blur-sm" onClick={() => setChannelOpen(false)} />
        )}
        <div className={`
          bg-white flex flex-col z-[500] shadow-2xl overflow-hidden
          md:relative md:h-full md:transition-all md:duration-300 md:ease-in-out md:shrink-0
          fixed left-0 right-0 bottom-0 transition-all duration-300 ease-in-out rounded-t-2xl md:rounded-none
          ${channelOpen
            ? 'md:w-[320px] md:min-w-[320px] md:border-l md:border-gray-200 top-[10%] md:top-auto'
            : 'md:w-0 md:min-w-0 md:border-none top-full md:top-auto'}
        `} style={{ borderLeft: 'none' }}>
          {channelOpen && (
            <ChatPanel
              key={activeChannelId}
              roomId={activeChannelId}
              socket={socket}
              myUser={myUserObj}
              onClose={() => setChannelOpen(false)}
              channelLabel={CHANNEL_LABELS[activeChannelId] || `#${activeChannelId}`}
            />
          )}
        </div>
      </div>

      <BottomBar
        myUser={myUserObj}
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        globalChatOpen={channelOpen}
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
