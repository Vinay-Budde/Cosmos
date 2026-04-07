import React from 'react';
import {
  Video, Headphones, ChevronDown, Users, Expand, LayoutGrid, Menu
} from 'lucide-react';
import { showToast } from '../utils/toastEmitter';

export default function TopBar({ onlineCount, hasNearby, localRoom, isConnected, onMenuToggle, isDeafened, toggleDeafen }) {
  return (
    <div
      className="flex items-center justify-between px-3 sm:px-4 fixed top-0 w-full z-[1000] border-b border-white/5"
      style={{ height: '44px', backgroundColor: '#1a1a2e' }}
    >
      {/* Left: Hamburger (mobile only) + Space name */}
      <div className="flex flex-1 items-center gap-2">
        {/* Mobile hamburger — shows sidebar drawer */}
        <button
          onClick={onMenuToggle}
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors mr-1"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 bg-[#2a2a44] px-2.5 py-1.5 rounded-lg border border-white/10 hover:bg-[#323250] transition-colors cursor-pointer group shadow-sm">
          <div className="w-4 h-4 bg-indigo-500 rounded flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-sm" />
          </div>
          <span className="text-white text-[13px] font-bold tracking-tight">Space</span>
          <ChevronDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80 transition-colors hidden sm:block" />
        </div>

        {localRoom && localRoom !== 'Spatial' && (
          <span className="hidden sm:inline text-[11px] text-white/40 font-semibold px-2 py-1 bg-white/5 rounded-lg">
            📍 {localRoom}
          </span>
        )}
      </div>

      {/* Center: Call status */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center bg-[#111120] rounded-lg p-0.5 border border-white/5 shadow-inner">
          <button 
            onClick={() => {
              toggleDeafen();
              showToast(!isDeafened ? 'Audio deafened (Muted all incoming sound)' : 'Audio undeafened');
            }}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md transition-all
              ${isDeafened ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            <Headphones className="w-[17px] h-[17px]" />
          </button>
          <div className="hidden sm:block w-px h-5 bg-white/10 mx-0.5" />
          <button
            onClick={() => showToast(hasNearby ? 'You are currently in a call.' : 'Move closer to someone to start a call!')}
            className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-md transition-all font-bold text-[11px] uppercase tracking-tight
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
      <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3.5 text-white/60">
        {/* Online count */}
        <div className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-lg border text-[11px] font-extrabold tracking-tighter cursor-pointer transition-colors
          ${onlineCount > 1
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
            : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
          }`}
        >
          <Users className="w-[15px] h-[15px]" />
          {/* Full label on desktop, count-only on mobile */}
          <span className="hidden sm:inline">{onlineCount} online</span>
          <span className="sm:hidden">{onlineCount}</span>
          {isConnected && onlineCount > 1 && (
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
          {!isConnected && (
            <div className="flex items-center gap-1 ml-0.5 sm:ml-1">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="hidden sm:inline text-[9px] uppercase tracking-widest font-black text-rose-400">Disconnected</span>
            </div>
          )}
          {isConnected && onlineCount === 1 && (
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 ml-0.5 sm:ml-1" />
          )}
        </div>

        <div className="hidden sm:block w-px h-4 bg-white/10" />

        {/* Utility buttons — hidden on mobile to save space */}
        <div className="hidden sm:flex items-center gap-3">
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
