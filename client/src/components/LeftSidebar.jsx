import React, { useState, useMemo } from 'react';
import {
  Search, Bell, Clock, Calendar, Video, Hash, ChevronDown, ChevronRight,
  Settings, X, MapPin, Users, Zap, Phone, MessageSquare
} from 'lucide-react';
import { showToast } from '../utils/toastEmitter';

const CHANNELS = [
  { id: 'threads',            label: 'threads',            color: '#6366f1' },
  { id: 'doubts-discussions', label: 'doubts-discussions', color: '#f59e0b' },
  { id: 'general',            label: 'general-chat',       color: '#10b981' },
];

const VIRTUAL_ROOMS = [
  { id: 'Room 1', emoji: '🏢' }, { id: 'Room 2', emoji: '🏢' },
  { id: 'Room 3', emoji: '🏢' }, { id: 'Room 4', emoji: '🏢' },
  { id: 'Room 5', emoji: '🏢' }, { id: 'Room 6', emoji: '🏢' },
  { id: 'Co-Working Space', emoji: '💼' },
  { id: 'Lecture Hall', emoji: '📚' },
  { id: 'Gaming Area', emoji: '🎮' },
];

// ── Calendar helpers ─────────────────────────────────────────────
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function CalendarPanel({ onClose }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array(firstDay).fill(null).concat(Array.from({length: daysInMonth}, (_, i) => i + 1));

  const EVENTS = [
    { day: today.getDate(), month: today.getMonth(), title: 'Team Standup', time: '9:00 AM', color: '#6366f1' },
    { day: today.getDate(), month: today.getMonth(), title: 'Lunch Break', time: '1:00 PM', color: '#f59e0b' },
    { day: today.getDate() + 2, month: today.getMonth(), title: 'Project Review', time: '3:00 PM', color: '#10b981' },
  ];

  const todayEvents = EVENTS.filter(e => e.month === month && e.day === today.getDate());

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
        <h3 className="font-bold text-slate-800 text-sm">Today's Calendar</h3>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4"/></button>
      </div>
      {/* Month nav */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0">
        <button onClick={() => setViewDate(new Date(year, month-1, 1))} className="text-slate-400 hover:text-slate-700 text-lg font-bold">‹</button>
        <span className="text-[13px] font-black text-slate-700">{MONTHS[month]} {year}</span>
        <button onClick={() => setViewDate(new Date(year, month+1, 1))} className="text-slate-400 hover:text-slate-700 text-lg font-bold">›</button>
      </div>
      {/* Grid */}
      <div className="px-3 shrink-0">
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => <div key={d} className="text-center text-[10px] font-black text-slate-400 py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((d, i) => {
            const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const hasEvent = d && EVENTS.some(e => e.day === d && e.month === month);
            return (
              <div key={i} className={`aspect-square flex flex-col items-center justify-center rounded-lg text-[12px] font-bold cursor-pointer transition-colors relative
                ${!d ? '' : isToday ? 'bg-indigo-500 text-white' : 'hover:bg-slate-100 text-slate-700'}`}>
                {d}
                {hasEvent && !isToday && <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-indigo-400"/>}
              </div>
            );
          })}
        </div>
      </div>
      {/* Today's events */}
      <div className="px-4 mt-3 flex-1 overflow-y-auto">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Today's Events</p>
        {todayEvents.length === 0
          ? <p className="text-[12px] text-slate-400 text-center py-4">No events today 🎉</p>
          : todayEvents.map((e, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 transition-colors mb-1">
              <div className="w-1 h-8 rounded-full shrink-0" style={{backgroundColor: e.color}}/>
              <div>
                <p className="text-[12px] font-bold text-slate-800">{e.title}</p>
                <p className="text-[10px] text-slate-400">{e.time}</p>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ── Activities Panel ─────────────────────────────────────────────
function ActivitiesPanel({ activities, onClose }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
        <h3 className="font-bold text-slate-800 text-sm">Activities</h3>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4"/></button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activities.length === 0
          ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-6">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center"><Bell className="w-5 h-5 text-slate-300"/></div>
              <p className="text-slate-500 font-semibold text-sm">No activity yet</p>
              <p className="text-slate-400 text-xs">Events like joins, reactions and hand raises will appear here.</p>
            </div>
          )
          : (
            <div className="p-3 space-y-1">
              {[...activities].reverse().map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0" style={{backgroundColor: a.color || '#6366f1'}}>
                    <span className="text-white font-black text-[11px]">{a.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-slate-800 leading-snug">{a.text}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{a.timeStr}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}

// ── Recent Conversations Panel ───────────────────────────────────
function ConversationsPanel({ recentConversations, onClose, onOpenChannel }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
        <h3 className="font-bold text-slate-800 text-sm">Recent Conversations</h3>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4"/></button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* Channels always shown */}
        <div className="p-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1 mb-2">Channels</p>
          {CHANNELS.map(c => (
            <button key={c.id} onClick={() => { onOpenChannel(c.id); onClose(); }}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm text-white" style={{backgroundColor: c.color}}>#</div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-slate-800">#{c.label}</p>
                <p className="text-[10px] text-slate-400">Click to open</p>
              </div>
            </button>
          ))}
        </div>
        {/* Recent proximity partners */}
        {recentConversations.length > 0 && (
          <div className="px-3 pb-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1 mb-2">Recent Nearby Chats</p>
            {recentConversations.map((u, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors mb-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0" style={{backgroundColor: u.color}}>{u.username.charAt(0).toUpperCase()}</div>
                <div>
                  <p className="text-[13px] font-bold text-slate-800">{u.username}</p>
                  <p className="text-[10px] text-slate-400">Proximity chat</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {recentConversations.length === 0 && (
          <div className="px-4 py-2 text-center">
            <p className="text-[12px] text-slate-400">No proximity chats yet. Walk near someone to chat!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Start New Call Panel ─────────────────────────────────────────
function StartCallPanel({ otherUsers, myUser, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = otherUsers.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
        <h3 className="font-bold text-slate-800 text-sm">Start New Call</h3>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4"/></button>
      </div>
      <div className="p-3 shrink-0">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search people..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-indigo-300"/>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {filtered.length === 0
          ? <p className="text-center text-slate-400 text-sm py-8">No one else online yet</p>
          : filtered.map(u => (
            <div key={u.socketId} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group mb-1">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm" style={{backgroundColor: u.color}}>{u.username.charAt(0).toUpperCase()}</div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"/>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-slate-800">{u.username}</p>
                <p className="text-[11px] text-slate-400">{u.room || 'Spatial'}</p>
              </div>
              <button
                onClick={() => { showToast(`📞 Move near ${u.username} to auto-connect!`); onClose(); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">
                <Phone className="w-3.5 h-3.5"/>
              </button>
            </div>
          ))
        }
        <div className="mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
          <p className="text-[11px] text-indigo-600 font-semibold">💡 Tip: Walk near someone on the map to automatically start a proximity video/audio call!</p>
        </div>
      </div>
    </div>
  );
}

// ── Search bar (inline) ──────────────────────────────────────────
function SearchBar({ query, onChange, onFocus }) {
  return (
    <div className="p-4">
      <div
        onClick={onFocus}
        className="w-full bg-white border border-slate-200/60 flex items-center px-3 py-1.5 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-indigo-300 transition-colors cursor-pointer group">
        <Search className="w-4 h-4 text-slate-400 mr-2.5 group-hover:text-indigo-400 transition-colors"/>
        <input
          type="text"
          value={query}
          onChange={e => onChange(e.target.value)}
          placeholder="Search"
          className="bg-transparent border-none outline-none text-[13px] w-full text-slate-600 font-medium placeholder:text-slate-300"
        />
        <div className="bg-slate-50 px-1.5 py-0.5 rounded-lg border border-slate-200 flex items-center gap-0.5 shadow-sm hidden sm:flex">
          <span className="text-[10px] text-slate-400 font-bold">⌘</span>
          <span className="text-[10px] text-slate-400 font-bold ml-0.5">K</span>
        </div>
      </div>
      {/* Inline search results */}
      {query && (
        <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {[...CHANNELS.filter(c => c.label.includes(query.toLowerCase())).map(c => (
            <div key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-[13px] text-slate-700">
              <Hash className="w-3.5 h-3.5 text-slate-400"/> #{c.label}
            </div>
          ))]}
          {!CHANNELS.some(c => c.label.includes(query.toLowerCase())) && (
            <div className="px-3 py-2 text-[12px] text-slate-400">No results</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export default function LeftSidebar({
  myUser, otherUsers, handRaisedBy = new Set(),
  mobileOpen, onMobileClose,
  onOpenChannel, onTeleportToRoom,
  activities = [], recentConversations = [],
  onSearchOpen,
}) {
  const [activePanel, setActivePanel] = useState(null); // 'activities'|'calendar'|'conversations'|'call'
  const [searchQuery, setSearchQuery] = useState('');
  const [roomsExpanded, setRoomsExpanded] = useState(true);
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const [teamExpanded, setTeamExpanded] = useState(true);

  const openPanel = (name) => setActivePanel(prev => prev === name ? null : name);

  // User count per room
  const roomUserCounts = useMemo(() => {
    const counts = {};
    otherUsers.forEach(u => {
      if (u.room) counts[u.room] = (counts[u.room] || 0) + 1;
    });
    return counts;
  }, [otherUsers]);

  return (
    <>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-[200] backdrop-blur-sm" onClick={onMobileClose}/>
      )}

      <div className={`
        h-full bg-[#fbfbfb] border-r border-slate-100 flex flex-col shrink-0 text-slate-800
        transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:w-[260px] md:z-[100]
        fixed top-0 left-0 w-[280px] z-[300]
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `} style={{ paddingTop: '44px' }}>

        {/* Mobile close */}
        <button onClick={onMobileClose} className="md:hidden absolute right-2 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100" style={{ top: '50px' }}>
          <X className="w-4 h-4"/>
        </button>

        {/* ── Panel overlay ── */}
        {activePanel && (
          <div className="absolute inset-0 bg-[#fbfbfb] z-10 flex flex-col" style={{ top: '44px' }}>
            {activePanel === 'activities'    && <ActivitiesPanel activities={activities} onClose={() => setActivePanel(null)}/>}
            {activePanel === 'calendar'      && <CalendarPanel onClose={() => setActivePanel(null)}/>}
            {activePanel === 'conversations' && <ConversationsPanel recentConversations={recentConversations} onClose={() => setActivePanel(null)} onOpenChannel={id => { onOpenChannel?.(id); setActivePanel(null); }}/>}
            {activePanel === 'call'          && <StartCallPanel otherUsers={otherUsers} myUser={myUser} onClose={() => setActivePanel(null)}/>}
          </div>
        )}

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {/* Search */}
          <SearchBar query={searchQuery} onChange={setSearchQuery} onFocus={onSearchOpen || (() => {})}/>

          {/* Nav items */}
          <div className="px-2 flex flex-col gap-0.5">
            <NavItem
              icon={<Bell className="w-[18px] h-[18px]"/>}
              label="Activities"
              badge={activities.length > 0 ? activities.length : null}
              active={activePanel === 'activities'}
              onClick={() => openPanel('activities')}
            />
            <NavItem
              icon={<Clock className="w-[18px] h-[18px]"/>}
              label="Recent Conversations"
              active={activePanel === 'conversations'}
              onClick={() => openPanel('conversations')}
            />
            <NavItem
              icon={<Calendar className="w-[18px] h-[18px]"/>}
              label="Today's Calendar"
              active={activePanel === 'calendar'}
              onClick={() => openPanel('calendar')}
            />
          </div>

          {/* Rooms */}
          <div className="mt-5 px-2">
            <SectionHeader label="Rooms" expanded={roomsExpanded} onToggle={() => setRoomsExpanded(p => !p)}/>
            {roomsExpanded && (
              <div className="flex flex-col gap-0.5">
                <NavItem
                  icon={<Phone className="w-[18px] h-[18px]"/>}
                  label="Start New Call"
                  active={activePanel === 'call'}
                  onClick={() => openPanel('call')}
                />
                {VIRTUAL_ROOMS.map(r => {
                  const count = roomUserCounts[r.id] || 0;
                  const usersHere = otherUsers.filter(u => u.room === r.id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => { onTeleportToRoom?.(r.id); showToast(`🚀 Teleporting to ${r.id}...`); onMobileClose?.(); }}
                      className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#ebebf5] cursor-pointer group transition-colors w-full text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        {count > 0
                          ? <div className="w-1.5 h-4 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"/>
                          : <div className="w-1.5 h-4 bg-slate-200 rounded-full"/>
                        }
                        <span className="text-lg leading-none">{r.emoji}</span>
                        <span className="text-[13px] font-bold text-slate-700 group-hover:text-slate-900">{r.id}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {usersHere.slice(0, 3).map((u, i) => (
                          <div key={i} className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[7px] text-white font-black" style={{backgroundColor: u.color}}>
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {count > 0 && <span className="text-[10px] text-emerald-600 font-black">{count}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Channels */}
          <div className="mt-5 px-2">
            <SectionHeader label="Channels" expanded={channelsExpanded} onToggle={() => setChannelsExpanded(p => !p)}/>
            {channelsExpanded && (
              <div className="flex flex-col gap-0.5">
                {CHANNELS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { onOpenChannel?.(c.id); onMobileClose?.(); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-all group w-full text-left"
                  >
                    <Hash className="w-[18px] h-[18px] shrink-0" style={{color: c.color}}/>
                    <span className="text-[13px] font-bold text-slate-600 group-hover:text-slate-900">{c.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Team */}
          <div className="mt-5 px-2 pb-12">
            <SectionHeader label={`Team (${otherUsers.length + 1})`} expanded={teamExpanded} onToggle={() => setTeamExpanded(p => !p)}/>
            {teamExpanded && (
              <div className="flex flex-col gap-1 pt-1">
                {myUser && <TeamMember user={myUser} isMe status={myUser.room || 'Spatial'} handRaised={handRaisedBy.has(myUser.socketId)}/>}
                {otherUsers.map(u => (
                  <TeamMember key={u.socketId} user={u} status={u.room || 'Spatial'} handRaised={handRaisedBy.has(u.socketId)}/>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function SectionHeader({ label, expanded, onToggle }) {
  return (
    <button onClick={onToggle} className="flex items-center gap-2 px-3 mb-2 w-full text-left hover:text-slate-600 transition-colors">
      {expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400"/> : <ChevronRight className="w-3.5 h-3.5 text-slate-400"/>}
      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </button>
  );
}

function NavItem({ icon, label, onClick, badge, active }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all group w-full text-left
        ${active ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-500'}`}
    >
      <div className="flex items-center gap-3">
        <div className={`transition-colors ${active ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-600'}`}>{icon}</div>
        <span className={`text-[13px] font-bold ${active ? 'text-indigo-700' : 'group-hover:text-slate-800'}`}>{label}</span>
      </div>
      {badge && (
        <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] text-white font-black">
          {badge > 9 ? '9+' : badge}
        </div>
      )}
    </button>
  );
}

function TeamMember({ user, isMe, status, handRaised }) {
  if (!user?.username) return null;
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-transparent hover:border-slate-100 transition-all cursor-pointer group">
      <div className="relative shrink-0">
        <div className="w-9 h-9 rounded-full border-2 border-white overflow-hidden shadow-sm ring-1 ring-slate-100">
          <div className="w-full h-full flex items-center justify-center text-white font-black text-sm" style={{backgroundColor: user.color}}>
            {user.username.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"/>
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-black text-slate-700 truncate">
            {user.username}{isMe && <span className="text-slate-400 font-medium ml-1 text-[11px]">(me)</span>}
          </span>
          {isMe && <Settings className="w-3 h-3 text-slate-300 hover:text-slate-500 transition-colors shrink-0"/>}
          {handRaised && <span className="text-sm leading-none shrink-0">✋</span>}
        </div>
        <span className="text-[11px] text-slate-400 font-medium truncate">{status}</span>
      </div>
    </div>
  );
}
