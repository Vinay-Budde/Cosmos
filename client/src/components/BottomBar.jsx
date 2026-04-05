import React, { useState } from 'react';
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, UserPlus,
  CircleDot, Move, Hand, ThumbsUp, Zap, MessageSquare,
  LayoutGrid, LogOut
} from 'lucide-react';
import { showToast } from '../utils/toastEmitter';

export default function BottomBar({
  myUser, chatOpen, setChatOpen, socket,
  micOn, cameraOn, onToggleMic, onToggleCamera,
  hasNearby, localStream
}) {
  const [handRaised,     setHandRaised]     = useState(false);
  const [showReactions,  setShowReactions]  = useState(false);

  // ── Hand raise ──────────────────────────────────────────────
  const handleHandRaise = () => {
    const next = !handRaised;
    setHandRaised(next);
    socket?.emit('hand_raise', { raised: next });
    showToast(next ? '✋ Hand raised!' : 'Hand lowered');
  };

  // ── Emoji reaction ──────────────────────────────────────────
  const handleReaction = (emoji) => {
    socket?.emit('reaction', { emoji });
    setShowReactions(false);
    showToast(`You reacted ${emoji}`);
  };

  // ── Screen share ────────────────────────────────────────────
  const handleShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      showToast('📺 Screen sharing started');
      // Stop sharing when user ends it
      screenStream.getVideoTracks()[0].onended = () => showToast('Screen sharing stopped');
    } catch {
      showToast('Screen share cancelled or unsupported');
    }
  };

  // ── Invite ──────────────────────────────────────────────────
  const handleInvite = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      showToast('🔗 Invite link copied to clipboard!');
    }).catch(() => {
      showToast(`Share this link: ${url}`);
    });
  };

  return (
    <div
      className="fixed bottom-0 w-full z-[1000] flex items-center px-4"
      style={{ height: '70px', backgroundColor: '#1a1a2e', borderTop: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Left: Identity + Media */}
      <div className="flex items-center gap-1 w-1/3">
        <div className="flex flex-col items-center justify-center p-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
          <div
            className="w-[30px] h-[30px] rounded-lg flex items-center justify-center border-2 border-white relative shadow-sm"
            style={{ backgroundColor: myUser?.color || '#eb5e28' }}
          >
            <span className="text-white text-[14px] font-black">
              {myUser?.username?.charAt(0).toUpperCase()}
            </span>
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-[2px] border-[#1a1a2e] bg-emerald-500 rounded-full" />
          </div>
          <span className="text-white/60 mt-1 font-bold tracking-tight" style={{ fontSize: '10px' }}>
            {myUser?.username || 'Guest'}
          </span>
        </div>

        <div className="w-px h-8 bg-white/10 mx-2" />

        <HardwareButton
          on={micOn}
          iconOn={<Mic className="w-[20px] h-[20px]" />}
          iconOff={<MicOff className="w-[20px] h-[20px]" />}
          label={micOn ? 'Mute' : 'Unmute'}
          onClick={onToggleMic}
        />
        <HardwareButton
          on={cameraOn}
          iconOn={<Video className="w-[20px] h-[20px]" />}
          iconOff={<VideoOff className="w-[20px] h-[20px]" />}
          label={cameraOn ? 'Stop Video' : 'Camera'}
          onClick={onToggleCamera}
        />
        <IconButton icon={<MonitorUp />} label="Share" onClick={handleShare} />
      </div>

      {/* Center: Tools */}
      <div className="flex items-center justify-center gap-1 w-1/3">
        <IconButton icon={<UserPlus />}   label="Invite" onClick={handleInvite} />
        <IconButton icon={<CircleDot />}  label="Record" onClick={() => showToast('🔴 Recording not available in this plan')} />
        <div className="w-px h-8 bg-white/10 mx-1" />
        <IconButton icon={<Move />}       label="Move"   active />
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
            onClick={() => setShowReactions(!showReactions)}
          />
          {showReactions && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1a1a2e] border border-white/10 p-2 rounded-xl flex gap-2 shadow-2xl z-50">
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

        <IconButton icon={<Zap />} label="Action" onClick={() => showToast('⚡ Action feature coming soon!')} />
      </div>

      {/* Right: Chat + Apps + Leave */}
      <div className="flex items-center justify-end gap-1 w-1/3">
        {/* Chat — proximity gated */}
        <div className="relative group">
          <button
            onClick={() => hasNearby ? setChatOpen(!chatOpen) : null}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all
              ${hasNearby
                ? chatOpen
                  ? 'bg-[#2a2a44] text-emerald-400 shadow-md ring-1 ring-white/10'
                  : 'text-white/40 hover:bg-white/5 hover:text-white'
                : 'text-white/15 cursor-not-allowed'
              }`}
          >
            <MessageSquare className="w-[20px] h-[20px] mb-[4px]" />
            <span className="tracking-tight font-bold" style={{ fontSize: '10px' }}>Chat</span>
          </button>
          {!hasNearby && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-[10px] rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              Move closer to someone to chat
            </div>
          )}
        </div>

        <IconButton icon={<LayoutGrid />} label="Apps" onClick={() => showToast('🧩 Apps coming soon!')} />

        <div className="w-px h-8 bg-white/10 mx-2" />

        <button
          className="flex flex-col items-center justify-center w-14 h-14 rounded-xl hover:bg-rose-500/20 cursor-pointer text-rose-500 transition-all active:scale-95 group"
          onClick={() => window.location.reload()}
        >
          <LogOut className="w-5 h-5 mb-[4px] ml-1 group-hover:rotate-12 transition-transform" />
          <span className="font-bold tracking-tight" style={{ fontSize: '10px' }}>Leave</span>
        </button>
      </div>
    </div>
  );
}

function HardwareButton({ on, iconOn, iconOff, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all hover:bg-white/5 group ${on ? 'text-emerald-500' : 'text-rose-500'}`}
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
      className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all group
        ${active
          ? 'bg-[#2a2a44] text-emerald-400 shadow-md ring-1 ring-white/10'
          : 'text-white/40 hover:bg-white/5 hover:text-white'
        }`}
    >
      <div className="mb-[4px] group-active:scale-90 transition-transform">
        {React.cloneElement(icon, { className: 'w-[20px] h-[20px]' })}
      </div>
      <span className="tracking-tight font-bold" style={{ fontSize: '10px' }}>{label}</span>
    </button>
  );
}
