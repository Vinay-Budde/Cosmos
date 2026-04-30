import React, { useState, useEffect, useRef } from 'react';
import { Search, Users, Hash, Map, X, ArrowRight } from 'lucide-react';

const CHANNELS = [
  { id: 'general', label: '#general-chat', desc: 'Open conversation for everyone' },
  { id: 'doubts-discussions', label: '#doubts-discussions', desc: 'Ask questions, share knowledge' },
  { id: 'threads', label: '#threads', desc: 'Ongoing topic discussions' },
];

const ROOMS_META = [
  { id: 'Room 1', emoji: '🏢', desc: 'Private meeting room' },
  { id: 'Room 2', emoji: '🏢', desc: 'Private meeting room' },
  { id: 'Room 3', emoji: '🏢', desc: 'Private meeting room' },
  { id: 'Room 4', emoji: '🏢', desc: 'Private meeting room' },
  { id: 'Room 5', emoji: '🏢', desc: 'Private meeting room' },
  { id: 'Room 6', emoji: '🏢', desc: 'Private meeting room' },
  { id: 'Co-Working Space', emoji: '💼', desc: 'Open desk area' },
  { id: 'Open Plan Office', emoji: '🖥️', desc: 'Large desk grid' },
  { id: 'Gaming Area', emoji: '🎮', desc: 'Arcade and lounge' },
  { id: 'Lecture Hall', emoji: '📚', desc: 'Classroom with whiteboard' },
  { id: 'Discussion Room 1', emoji: '💬', desc: 'Small discussion booth' },
  { id: 'Discussion Room 2', emoji: '💬', desc: 'Small discussion booth' },
  { id: 'Discussion Room 3', emoji: '💬', desc: 'Small discussion booth' },
];

export default function SearchModal({ open, onClose, otherUsers, myUser, onOpenChannel, onTeleportToRoom }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard shortcut: Cmd+K / Ctrl+K opens, Escape closes
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!open) return; // handled by parent
      }
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.toLowerCase();

  const filteredUsers = [myUser, ...otherUsers].filter(u =>
    u?.username?.toLowerCase().includes(q)
  );
  const filteredChannels = CHANNELS.filter(c =>
    c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
  );
  const filteredRooms = ROOMS_META.filter(r =>
    r.id.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q)
  );

  const hasResults = filteredUsers.length > 0 || filteredChannels.length > 0 || filteredRooms.length > 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[9000] flex items-start justify-center pt-[10vh] backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-[600px] mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, channels, rooms..."
            className="flex-1 text-slate-800 text-[15px] font-medium bg-transparent border-none outline-none placeholder:text-slate-300"
          />
          <button
            onClick={onClose}
            className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <kbd className="shrink-0 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[11px] text-slate-500 font-mono font-bold">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {!hasResults && (
            <div className="py-12 text-center text-slate-400 text-sm font-medium">
              No results for "{query}"
            </div>
          )}

          {/* People */}
          {filteredUsers.length > 0 && (
            <Section label="People" icon={<Users className="w-3.5 h-3.5" />}>
              {filteredUsers.map((u) => (
                <ResultRow
                  key={u.socketId || 'me'}
                  onClick={onClose}
                  left={
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0"
                      style={{ backgroundColor: u.color }}
                    >
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                  }
                  title={u.username + (u.socketId === myUser?.socketId ? ' (you)' : '')}
                  sub={u.room || 'Spatial'}
                  badge={<span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
                />
              ))}
            </Section>
          )}

          {/* Channels */}
          {filteredChannels.length > 0 && (
            <Section label="Channels" icon={<Hash className="w-3.5 h-3.5" />}>
              {filteredChannels.map((c) => (
                <ResultRow
                  key={c.id}
                  onClick={() => { onOpenChannel(c.id); onClose(); }}
                  left={
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm shrink-0">
                      #
                    </div>
                  }
                  title={c.label}
                  sub={c.desc}
                  badge={<ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />}
                />
              ))}
            </Section>
          )}

          {/* Rooms */}
          {filteredRooms.length > 0 && (
            <Section label="Rooms" icon={<Map className="w-3.5 h-3.5" />}>
              {filteredRooms.map((r) => (
                <ResultRow
                  key={r.id}
                  onClick={() => { onTeleportToRoom(r.id); onClose(); }}
                  left={
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-lg shrink-0">
                      {r.emoji}
                    </div>
                  }
                  title={r.id}
                  sub={r.desc}
                  badge={<span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full shrink-0">Teleport</span>}
                />
              ))}
            </Section>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-4 text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1"><kbd className="bg-slate-50 border border-slate-200 px-1 rounded font-mono text-[10px]">↵</kbd> Open</span>
          <span className="flex items-center gap-1"><kbd className="bg-slate-50 border border-slate-200 px-1 rounded font-mono text-[10px]">Esc</kbd> Close</span>
          <span className="ml-auto">⌘K to open anywhere</span>
        </div>
      </div>
    </div>
  );
}

function Section({ label, icon, children }) {
  return (
    <div className="py-2">
      <div className="flex items-center gap-2 px-4 py-1.5 text-[11px] font-black text-slate-400 uppercase tracking-widest">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

function ResultRow({ left, title, sub, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors group text-left"
    >
      {left}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold text-slate-800 truncate">{title}</div>
        <div className="text-[11px] text-slate-400 truncate">{sub}</div>
      </div>
      {badge}
    </button>
  );
}
