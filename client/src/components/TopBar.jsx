import React from 'react';
import {
  Video, Headphones, ChevronDown, Users, Expand, LayoutGrid
} from 'lucide-react';

export default function TopBar({ onlineCount, hasNearby, localRoom, isConnected }) {
  return (
    <div
      className="flex items-center justify-between px-4 fixed top-0 w-full z-[1000] border-b border-white/5"
      style={{ height: '44px', backgroundColor: '#1a1a2e' }}
    >
      {/* Left: Space name */}
      <div className="flex flex-1 items-center gap-2">
        <div className="flex items-center gap-2 bg-[#2a2a44] px-3 py-1.5 rounded-lg border border-white/10 hover:bg-[#323250] transition-colors cursor-pointer group shadow-sm">
          <div className="w-4 h-4 bg-indigo-500 rounded flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-sm" />
          </div>
          <span className="text-white text-[13px] font-bold tracking-tight">Space</span>
          <ChevronDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80 transition-colors" />
        </div>
        {localRoom && localRoom !== 'Spatial' && (
          <span className="text-[11px] text-white/40 font-semibold px-2 py-1 bg-white/5 rounded-lg">
            📍 {localRoom}
          </span>
        )}
      </div>

      {/* Center: Audio/Video controls */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center bg-[#111120] rounded-lg p-0.5 border border-white/5 shadow-inner">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-all">
            <Headphones className="w-[17px] h-[17px]" />
          </button>
          <div className="w-px h-5 bg-white/10 mx-0.5" />
          {/* Call button — green when someone nearby */}
          <button
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all font-bold text-[11px] uppercase tracking-tight
              ${hasNearby
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 hover:bg-emerald-500'
                : 'bg-[#2a2a44] text-white/70 hover:text-white hover:bg-[#323250]'
              }`}
          >
            <Video className="w-[17px] h-[17px]" />
            {hasNearby ? 'In Call' : 'Call'}
          </button>
        </div>
      </div>

      {/* Right: Online count + utilities */}
      <div className="flex flex-1 items-center justify-end gap-3.5 text-white/60">
        {/* Online count — show actual number */}
        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] font-extrabold tracking-tighter cursor-pointer transition-colors
          ${onlineCount > 1
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
            : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
          }`}
        >
          <Users className="w-[15px] h-[15px]" />
          <span>{onlineCount} online</span>
          {isConnected && onlineCount > 1 && (
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
          {!isConnected && (
            <div className="flex items-center gap-1.5 ml-1 px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[9px] uppercase tracking-widest font-black">Disconnected</span>
            </div>
          )}
          {isConnected && onlineCount === 1 && (
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 ml-1" />
          )}
        </div>

        <div className="w-px h-4 bg-white/10" />

        <div className="flex items-center gap-3">
          <button className="hover:text-white transition-colors group">
            <LayoutGrid className="w-[17px] h-[17px] group-hover:scale-110 transition-transform" />
          </button>
          <button
            className="hover:text-white transition-colors group"
            onClick={() => document.documentElement.requestFullscreen().catch(() => null)}
          >
            <Expand className="w-[17px] h-[17px] group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
