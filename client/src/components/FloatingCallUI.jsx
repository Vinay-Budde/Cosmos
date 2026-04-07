import React, { useEffect, useRef } from 'react';
import { MicOff, VideoOff } from 'lucide-react';

export default function FloatingCallUI({
  myUser, participants, localStream, remoteStreams, iceStates, micOn, cameraOn
}) {
  const allParticipants = [
    { ...myUser, isLocal: true },
    ...participants.map(p => ({ ...p, isLocal: false })),
  ];

  if (allParticipants.length < 2) return null;

  return (
    // On mobile: stack vertically and align left, smaller cards
    // On desktop: row layout centered
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex flex-col sm:flex-row gap-2 sm:gap-3 items-center sm:items-start">
      {allParticipants.map(user => (
        <VideoCard
          key={user.socketId || 'local'}
          user={user}
          stream={user.isLocal ? localStream : remoteStreams?.[user.socketId]}
          isLocal={user.isLocal}
          micOn={user.isLocal ? micOn : user.micOn}
          cameraOn={user.isLocal ? cameraOn : user.cameraOn}
          iceState={user.isLocal ? 'connected' : iceStates?.[user.socketId]}
        />
      ))}
    </div>
  );
}

function VideoCard({ user, stream, isLocal, micOn, cameraOn, iceState }) {
  const videoRef = useRef(null);

  const tracks = stream ? stream.getTracks() : [];
  const trackCount = tracks.length;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    if (trackCount > 0) {
      console.log(`[VideoCard] Rendering ${user.username} with ${trackCount} tracks:`, tracks.map(t => t.kind));
    }

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    // Browsers sometimes need a manual play() if tracks are added to an existing stream
    video.play().catch(err => {
      if (err.name !== 'AbortError' && trackCount > 0) {
        console.warn(`[VideoCard] Autoplay blocked for ${user.username}:`, err.message);
      }
    });
  }, [stream, trackCount, user.username]);

  const initial = user.username?.charAt(0).toUpperCase() || '?';

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Video / Avatar card — smaller on mobile */}
      <div
        className="relative overflow-hidden rounded-xl sm:rounded-2xl border-2 shadow-2xl"
        style={{
          // Mobile: 110×82, Desktop: 160×120
          width: 'clamp(90px, 28vw, 160px)',
          height: 'clamp(68px, 21vw, 120px)',
          borderColor: user.color || '#6366f1',
          boxShadow: `0 0 20px ${user.color || '#6366f1'}44`,
        }}
      >
        {/* Video layer (always rendered if stream exists, to keep audio active) */}
        {stream && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className={`w-full h-full object-cover transition-opacity duration-500 ${cameraOn ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
          />
        )}

        {/* Avatar layer (shown when camera is off or stream is missing) */}
        {(!cameraOn || !stream) && (
          <div
            className="w-full h-full flex items-center justify-center bg-slate-900/50 backdrop-blur-md"
            style={{ 
              background: `linear-gradient(135deg, ${user.color}22, ${user.color}55)`,
              zIndex: cameraOn ? -1 : 1 
            }}
          >
            <div
              className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-white text-xl sm:text-3xl font-black shadow-lg border-2 border-white/20 animate-in zoom-in-50 duration-500"
              style={{ backgroundColor: user.color || '#6366f1' }}
            >
              {initial}
            </div>
          </div>
        )}

        {/* Mic/Camera indicator */}
        <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 flex gap-1">
          {!micOn && (
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-500/80 flex items-center justify-center backdrop-blur-sm">
              <MicOff size={8} className="text-white" />
            </div>
          )}
          {!cameraOn && (
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-500/80 flex items-center justify-center backdrop-blur-sm">
              <VideoOff size={8} className="text-white" />
            </div>
          )}
        </div>

        {/* Connection Status Badge */}
        <div
          className={`absolute top-1 sm:top-2 right-1 sm:right-2 px-1 sm:px-1.5 py-0.5 rounded text-[7px] sm:text-[8px] font-black uppercase tracking-tighter shadow-sm backdrop-blur-md border
            ${iceState === 'connected' || iceState === 'completed'
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : iceState === 'failed' || iceState === 'disconnected'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
            }`}
        >
          {iceState === 'connected' || iceState === 'completed' ? 'Live' : iceState === 'failed' ? 'Failed' : '...'}
        </div>

        {/* Online dot */}
        <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
      </div>

      {/* Name tag */}
      <div
        className="px-2 sm:px-3 py-0.5 rounded-full text-white text-[10px] sm:text-[12px] font-black shadow-md"
        style={{ backgroundColor: user.color || '#6366f1' }}
      >
        {user.username}
      </div>
    </div>
  );
}
