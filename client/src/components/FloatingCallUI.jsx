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
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex gap-3 items-start">
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

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initial = user.username?.charAt(0).toUpperCase() || '?';

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Video / Avatar card */}
      <div
        className="relative overflow-hidden rounded-2xl border-2 shadow-2xl"
        style={{
          width: 160,
          height: 120,
          borderColor: user.color || '#6366f1',
          boxShadow: `0 0 20px ${user.color || '#6366f1'}44`,
        }}
      >
        {cameraOn && stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className="w-full h-full object-cover"
          />
        ) : (
          /* Big pixel-art-style avatar placeholder */
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${user.color}22, ${user.color}55)` }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg border-2 border-white/20"
              style={{ backgroundColor: user.color || '#6366f1' }}
            >
              {initial}
            </div>
          </div>
        )}

        {/* Mic/Camera indicator icons at bottom-left */}
        <div className="absolute bottom-2 left-2 flex gap-1">
          {!micOn && (
            <div className="w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center backdrop-blur-sm">
              <MicOff size={10} className="text-white" />
            </div>
          )}
          {!cameraOn && (
            <div className="w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center backdrop-blur-sm">
              <VideoOff size={10} className="text-white" />
            </div>
          )}
        </div>

        {/* Connection Status Badge */}
        <div 
          className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shadow-sm backdrop-blur-md border 
            ${iceState === 'connected' || iceState === 'completed' 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
              : iceState === 'failed' || iceState === 'disconnected'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
            }`}
        >
          {iceState === 'connected' || iceState === 'completed' ? 'Live' : iceState === 'failed' ? 'Failed' : 'Connecting...'}
        </div>

        {/* Online dot bottom-right */}
        <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
      </div>

      {/* Name tag below card */}
      <div
        className="px-3 py-0.5 rounded-full text-white text-[12px] font-black shadow-md"
        style={{ backgroundColor: user.color || '#6366f1' }}
      >
        {user.username}
      </div>
    </div>
  );
}
