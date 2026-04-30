import React, { useState } from 'react';
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, UserPlus,
  CircleDot, Move, Hand, ThumbsUp, Zap, MessageSquare,
  LayoutGrid, LogOut, MoreHorizontal, Hash
} from 'lucide-react';
import { showToast } from '../utils/toastEmitter';

export default function BottomBar({
  myUser, chatOpen, setChatOpen, globalChatOpen, onOpenGeneralChat,
  socket, micOn, cameraOn, onToggleMic, onToggleCamera,
  hasNearby, localStream
}) {
  const [handRaised,    setHandRaised]    = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showMore,      setShowMore]      = useState(false);

  const handleHandRaise = () => {
    const next = !handRaised;
    setHandRaised(next);
    socket?.emit('hand_raise', { raised: next });
    showToast(next ? '✋ Hand raised!' : 'Hand lowered');
  };

  const handleReaction = (emoji) => {
    socket?.emit('reaction', { emoji });
    setShowReactions(false);
    showToast(`You reacted ${emoji}`);
  };

  const handleShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      showToast('📺 Screen sharing started');
      screenStream.getVideoTracks()[0].onended = () => showToast('Screen sharing stopped');
    } catch {
      showToast('Screen share cancelled or not supported');
    }
  };

  const handleInvite = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      showToast('🔗 Invite link copied to clipboard!');
    }).catch(() => {
      showToast(`Share this link: ${url}`);
    });
  };

  const handleToggleProximityChat = () => {
    if (hasNearby) {
      setChatOpen(prev => !prev);
    } else {
      showToast('Move closer to someone to chat!');
    }
  };

  return (
    <div
      className="fixed bottom-0 w-full z-[1000] flex items-center px-2 sm:px-4"
      style={{ height: '70px', backgroundColor: '#1a1a2e', borderTop: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Left: Identity + Media */}
      <div className="flex items-center gap-0.5 sm:gap-1 w-auto sm:w-1/3">
        {/* Avatar */}
        <div className="flex flex-col items-center justify-center p-1 sm:p-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
          <div
            className="w-[28px] h-[28px] rounded-lg flex items-center justify-center border-2 border-white relative shadow-sm"
            style={{ backgroundColor: myUser?.color || '#eb5e28' }}
          >
            <span className="text-white text-[13px] font-black">
              {myUser?.username?.charAt(0).toUpperCase()}
            </span>
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-[2px] border-[#1a1a2e] bg-emerald-500 rounded-full" />
          </div>
          <span className="text-white/60 mt-1 font-bold tracking-tight hidden sm:block" style={{ fontSize: '10px' }}>
            {myUser?.username || 'Guest'}
          </span>
        </div>

        <div className="w-px h-8 bg-white/10 mx-1 hidden sm:block" />

        <HardwareButton
          on={micOn}
          iconOn={<Mic className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />}
          iconOff={<MicOff className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />}
          label={micOn ? 'Mute' : 'Unmute'}
          onClick={onToggleMic}
        />
        <HardwareButton
          on={cameraOn}
          iconOn={<Video className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />}
          iconOff={<VideoOff className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />}
          label={cameraOn ? 'Stop Video' : 'Camera'}
          onClick={onToggleCamera}
        />

        {/* Screen share — desktop only */}
        <div className="hidden sm:block">
          <IconButton icon={<MonitorUp />} label="Share" onClick={handleShare} />
        </div>
      </div>

      {/* Center: Tools */}
      <div className="flex items-center justify-center gap-0.5 sm:gap-1 flex-1">
        {/* Desktop: full tool row */}
        <div className="hidden sm:flex items-center gap-1">
          <IconButton icon={<UserPlus />}  label="Invite" onClick={handleInvite} />
          <IconButton icon={<CircleDot />} label="Record" onClick={() => showToast('🔴 Recording not available in this plan')} />
          <div className="w-px h-8 bg-white/10 mx-1" />
        </div>

        <IconButton icon={<Move />} label="Move" active />

        <IconButton
          icon={<Hand className={handRaised ? 'text-amber-400' : ''} />}
          label="Hand"
          active={handRaised}
          onClick={handleHandRaise}
        />

        {/* React picker */}
        <div className="relative">
          <IconButton
            icon={<ThumbsUp className={showReactions ? 'text-amber-400' : ''} />}
            label="React"
            active={showReactions}
            onClick={() => { setShowReactions(!showReactions); setShowMore(false); }}
          />
          {showReactions && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1a1a2e] border border-white/10 p-2 rounded-xl flex gap-2 shadow-2xl z-50 flex-wrap max-w-[200px] sm:max-w-none sm:flex-nowrap">
              {['🔥', '👍', '❤️', '👏', '😂', '😮', '🎉', '💯'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="text-xl hover:scale-125 transition-transform p-1 rounded-lg hover:bg-white/10"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile: "More" button */}
        <div className="sm:hidden relative">
          <IconButton
            icon={<MoreHorizontal className={showMore ? 'text-indigo-400' : ''} />}
            label="More"
            active={showMore}
            onClick={() => { setShowMore(!showMore); setShowReactions(false); }}
          />
          {showMore && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl z-50 py-2 min-w-[170px]">
              <MobileMenuItem icon={<UserPlus className="w-4 h-4" />}   label="Invite"        onClick={() => { handleInvite(); setShowMore(false); }} />
              <MobileMenuItem icon={<MonitorUp className="w-4 h-4" />}  label="Share Screen"  onClick={() => { handleShare(); setShowMore(false); }} />
              <MobileMenuItem icon={<CircleDot className="w-4 h-4" />}  label="Record"        onClick={() => { showToast('🔴 Not available'); setShowMore(false); }} />
              <MobileMenuItem icon={<Hash className="w-4 h-4" />}       label="General Chat"  onClick={() => { onOpenGeneralChat?.(); setShowMore(false); }} />
              <MobileMenuItem icon={<Zap className="w-4 h-4" />}        label="Action"        onClick={() => { showToast('⚡ Coming soon!'); setShowMore(false); }} />
            </div>
          )}
        </div>

        {/* Action — desktop only */}
        <div className="hidden sm:block">
          <IconButton icon={<Zap />} label="Action" onClick={() => showToast('⚡ Action feature coming soon!')} />
        </div>
      </div>

      {/* Right: Proximity Chat + General Chat + Apps + Leave */}
      <div className="flex items-center justify-end gap-0.5 sm:gap-1 w-auto sm:w-1/3">

        {/* Proximity Chat */}
        <div className="relative group">
          <button
            onClick={handleToggleProximityChat}
            className={`flex flex-col items-center justify-center w-12 sm:w-14 h-14 rounded-xl transition-all
              ${hasNearby
                ? chatOpen
                  ? 'bg-[#2a2a44] text-emerald-400 shadow-md ring-1 ring-white/10'
                  : 'text-white/40 hover:bg-white/5 hover:text-white'
                : 'text-white/15 cursor-not-allowed'
              }`}
          >
            <MessageSquare className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] mb-[4px]" />
            <span className="tracking-tight font-bold" style={{ fontSize: '10px' }}>Nearby</span>
          </button>
          {!hasNearby && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-[10px] rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
              Move closer to someone
            </div>
          )}
        </div>

        {/* General Chat — always available */}
        <div className="hidden sm:block">
          <button
            onClick={onOpenGeneralChat}
            className={`flex flex-col items-center justify-center w-12 sm:w-14 h-14 rounded-xl transition-all
              ${globalChatOpen
                ? 'bg-[#2a2a44] text-indigo-400 shadow-md ring-1 ring-white/10'
                : 'text-white/40 hover:bg-white/5 hover:text-white'
              }`}
          >
            <Hash className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] mb-[4px]" />
            <span className="tracking-tight font-bold" style={{ fontSize: '10px' }}>General</span>
          </button>
        </div>

        {/* Apps — desktop only */}
        <div className="hidden sm:block">
          <IconButton icon={<LayoutGrid />} label="Apps" onClick={() => showToast('🧩 Apps coming soon!')} />
        </div>

        <div className="w-px h-8 bg-white/10 mx-1 hidden sm:block" />

        <button
          className="flex flex-col items-center justify-center w-12 sm:w-14 h-14 rounded-xl hover:bg-rose-500/20 cursor-pointer text-rose-500 transition-all active:scale-95 group"
          onClick={() => window.location.reload()}
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5 mb-[4px] ml-1 group-hover:rotate-12 transition-transform" />
          <span className="font-bold tracking-tight" style={{ fontSize: '10px' }}>Leave</span>
        </button>
      </div>
    </div>
  );
}

function MobileMenuItem({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 transition-colors text-[13px] font-bold"
    >
      <span className="text-white/40">{icon}</span>
      {label}
    </button>
  );
}

function HardwareButton({ on, iconOn, iconOff, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-12 sm:w-14 h-14 rounded-xl transition-all hover:bg-white/5 group ${on ? 'text-emerald-500' : 'text-rose-500'}`}
    >
      <div className="mb-[4px] group-active:scale-95 transition-transform">
        {on ? iconOn : iconOff}
      </div>
      <span className="text-white/60 tracking-tight font-bold group-hover:text-white transition-colors" style={{ fontSize: '10px' }}>
        {label}
      </span>
    </button>
  );
}

function IconButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-12 sm:w-14 h-14 rounded-xl transition-all group
        ${active
          ? 'bg-[#2a2a44] text-emerald-400 shadow-md ring-1 ring-white/10'
          : 'text-white/40 hover:bg-white/5 hover:text-white'
        }`}
    >
      <div className="mb-[4px] group-active:scale-90 transition-transform">
        {React.cloneElement(icon, { className: 'w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]' })}
      </div>
      <span className="tracking-tight font-bold" style={{ fontSize: '10px' }}>{label}</span>
    </button>
  );
}
