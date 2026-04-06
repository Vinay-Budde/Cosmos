import React from 'react';
import { Search, Bell, Clock, Calendar, Video, Hash, ChevronDown, Settings, LayoutGrid, X } from 'lucide-react';
import { showToast } from '../utils/toastEmitter';

export default function LeftSidebar({ myUser, otherUsers, handRaisedBy = new Set(), mobileOpen, onMobileClose }) {
  const handleFeatureSoon = (name) => showToast(`${name} feature coming soon!`);

  return (
    <>
      {/* Mobile backdrop overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-[200] backdrop-blur-sm"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`
          h-full bg-[#fbfbfb] border-r border-slate-100 flex flex-col shrink-0 overflow-y-auto text-slate-800 custom-scrollbar
          transition-transform duration-300 ease-in-out
          /* Desktop: always visible, inline */
          md:relative md:translate-x-0 md:w-[260px] md:z-[100]
          /* Mobile: fixed drawer that slides in from left */
          fixed top-0 left-0 w-[280px] z-[300]
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ paddingTop: '44px' }}
      >
        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="md:hidden absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          style={{ top: '50px' }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Search Bar */}
        <div className="p-4">
          <div className="w-full bg-white border border-slate-200/60 flex items-center px-3 py-1.5 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-colors group">
            <Search className="w-4 h-4 text-slate-400 mr-2.5" />
            <input
              type="text"
              placeholder="Search"
              className="bg-transparent border-none outline-none text-[13px] w-full text-slate-600 font-medium placeholder:text-slate-300"
            />
            <div className="bg-slate-50 px-1.5 py-0.5 rounded-lg border border-slate-200 flex items-center gap-0.5 shadow-sm hidden sm:flex">
              <span className="text-[10px] text-slate-400 font-bold">⌘</span>
              <span className="text-[10px] text-slate-400 font-bold ml-0.5 text-slate-500">K</span>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="px-2 flex flex-col gap-0.5">
          <NavItem icon={<Bell className="w-[18px] h-[18px]" />}     label="Activities"           onClick={() => handleFeatureSoon('Activities')} />
          <NavItem icon={<Clock className="w-[18px] h-[18px]" />}    label="Recent Conversations"  onClick={() => handleFeatureSoon('Conversations')} />
          <NavItem icon={<Calendar className="w-[18px] h-[18px]" />} label="Today's Calendar"      onClick={() => handleFeatureSoon('Calendar')} />
        </div>

        {/* Rooms Section */}
        <div className="mt-6 px-2">
          <SectionHeader label="Rooms" />
          <div className="flex flex-col gap-0.5">
            <NavItem icon={<Video className="w-[18px] h-[18px]" />} label="Start New Call" onClick={() => handleFeatureSoon('Call')} />
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#f2f2f9] cursor-pointer group hover:bg-[#ebebf5] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-4.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                <div className="w-5 h-5 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-200/50">
                  <LayoutGrid className="w-3 h-3 text-slate-500" />
                </div>
                <span className="text-[13px] font-extrabold text-slate-700">Room 3</span>
              </div>
              <div className="flex -space-x-2">
                {otherUsers.slice(0, 1).map((u, i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden shadow-sm ring-1 ring-slate-200">
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-white font-black" style={{ backgroundColor: u.color }}>
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Channels Section */}
        <div className="mt-6 px-2">
          <SectionHeader label="Channels" />
          <div className="flex flex-col gap-0.5">
            <NavItem icon={<Hash className="w-[18px] h-[18px] opacity-40" />} label="Threads"            onClick={() => handleFeatureSoon('Threads')} />
            <NavItem icon={<Hash className="w-[18px] h-[18px] opacity-40" />} label="doubts-discussions" onClick={() => handleFeatureSoon('Doubts')} />
            <NavItem icon={<Hash className="w-[18px] h-[18px] opacity-40" />} label="general-chat"       onClick={() => handleFeatureSoon('General')} />
          </div>
        </div>

        {/* Team Section */}
        <div className="mt-6 px-2 pb-12">
          <SectionHeader label="Team" />
          <div className="flex flex-col gap-2 pt-1">
            {myUser && (
              <TeamMember 
                user={myUser} 
                isMe 
                status={myUser.room || 'Spatial'} 
                handRaised={handRaisedBy.has(myUser.socketId)} 
              />
            )}
            {otherUsers.map((u) => (
              <TeamMember 
                key={u.socketId} 
                user={u} 
                status={u.room || 'Spatial'} 
                handRaised={handRaisedBy.has(u.socketId)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function SectionHeader({ label }) {
  return (
    <div className="flex items-center gap-2 px-3 mb-2.5">
      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function NavItem({ icon, label, onClick, badge }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="text-slate-400 group-hover:text-slate-600 transition-colors">{icon}</div>
        <span className="text-[13px] font-bold text-slate-500 group-hover:text-slate-800">{label}</span>
      </div>
      {badge && (
        <div className="w-5 h-5 rounded-full bg-[#7c8cf5] flex items-center justify-center text-[10px] text-white font-black shadow-sm ring-2 ring-[#7c8cf5]/20">
          {badge}
        </div>
      )}
    </div>
  );
}

function TeamMember({ user, isMe, status, handRaised }) {
  if (!user || !user.username) return null;
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-transparent hover:border-slate-100 transition-all cursor-pointer group">
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-50 overflow-hidden shadow-sm ring-1 ring-slate-100 transition-transform group-hover:scale-105">
          <div className="w-full h-full flex items-center justify-center text-white font-black text-base drop-shadow-sm" style={{ backgroundColor: user.color }}>
            {user.username.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-[2.5px] border-white rounded-full shadow-sm" />
      </div>
      <div className="flex flex-col min-w-0 pr-1 flex-1">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-[13.5px] font-black text-slate-700 truncate leading-none">
            {user.username} {isMe && <span className="text-slate-400 font-medium ml-0.5 text-[11px]">(me)</span>}
          </span>
          {isMe && <Settings className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 transition-colors" />}
          {handRaised && <span title="Hand raised" className="text-base leading-none">✋</span>}
        </div>
        <span className="text-[11px] text-slate-400 font-bold tracking-tight mt-0.5">{status}</span>
      </div>
      <div className="text-[9px] text-slate-300 font-black tracking-tighter uppercase group-hover:text-slate-400 transition-colors">GUEST</div>
    </div>
  );
}
