import React, { useState, useRef, useEffect } from 'react';
import { X, Smile, Paperclip, Bold, Italic, Strikethrough, Link, Code, Send } from 'lucide-react';

export default function ChatSidebar({ open, onClose, socket, myUser, messages, typingUsers, hasNearby, nearbyUsers = [], partner }) {
  const [inputValue, setInputValue] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (socket && hasNearby && nearbyUsers.length > 0) {
      const targetIds = nearbyUsers.map(u => u.socketId);
      socket.emit('typing', { targetIds, username: myUser?.username });
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !socket || !hasNearby || nearbyUsers.length === 0) return;
    const targetIds = nearbyUsers.map(u => u.socketId);
    socket.emit('send_message', { targetIds, message: inputValue.trim() });
    setInputValue('');
  };

  return (
    <div
      className="h-full bg-white flex flex-col z-[500] shadow-2xl transition-all duration-300 ease-in-out shrink-0 overflow-hidden"
      style={{
        width: open ? '300px' : '0px',
        borderLeft: open ? '1px solid #e5e7eb' : 'none',
        minWidth: open ? '300px' : '0',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0 bg-white">
        <div className="flex flex-col">
          <h2 className="text-slate-800 font-bold text-[15px] tracking-wide">Chat</h2>
          {hasNearby && nearbyUsers.length > 0 && (
            <span className="text-[11px] text-emerald-600 font-semibold">
              {nearbyUsers.map(u => u.username).join(', ')} nearby
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors p-1 hover:bg-slate-100 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto flex flex-col bg-white custom-scrollbar">
        {!hasNearby ? (
          /* No one nearby state */
          <div className="m-auto flex flex-col items-center justify-center p-8 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 animate-pulse">
              <span className="text-3xl">🚶</span>
            </div>
            <div>
              <p className="text-slate-600 font-bold text-sm">No one nearby</p>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Walk closer to another person<br />to start a proximity chat
              </p>
            </div>
            <div className="flex items-center gap-2 text-emerald-500/80 text-[11px] font-bold">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Scanning for nearby users...
            </div>
          </div>
        ) : messages.length === 0 ? (
          /* Empty — show partner intro (matches reference exactly) */
          <div className="m-auto flex flex-col items-center justify-center p-6 text-center">
            {partner ? (
              <>
                <div
                  className="w-[72px] h-[72px] rounded-full flex items-center justify-center mb-4 border-[3px] shadow-lg"
                  style={{ backgroundColor: partner.color, borderColor: partner.color + '44' }}
                >
                  <span className="text-white font-black text-2xl">
                    {partner.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="text-slate-700 font-semibold text-[14px] leading-snug">
                  This is the beginning of your chat history with{' '}
                  <span style={{ color: partner.color }} className="font-black">
                    @{partner.username}
                  </span>
                  .
                </p>
                <p className="text-slate-400 text-[12px] mt-2 leading-relaxed">
                  Send messages, attachments, links, emojis, and more.
                </p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full mb-3 bg-indigo-100 flex items-center justify-center border-2 border-indigo-200">
                  <span className="text-2xl">💬</span>
                </div>
                <p className="text-slate-600 font-semibold text-[13px]">
                  Say something to get started!
                </p>
              </>
            )}
          </div>
        ) : (
          /* Messages */
          <div className="p-3 space-y-4 flex flex-col justify-end min-h-full">
            {messages.map((msg, idx) => {
              const isMe = msg.senderId === myUser?.socketId;
              return (
                <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {!isMe && (
                      <div
                        className="w-[26px] h-[26px] rounded-full shrink-0 flex items-center justify-center border border-white shadow-sm"
                        style={{ backgroundColor: msg.color }}
                      >
                        <span className="text-white text-[10px] font-bold">{msg.sender.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <span className="font-bold text-[12px] text-slate-700">{msg.sender}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div
                    className={`px-3 py-2 text-[13px] max-w-[85%] leading-relaxed shadow-sm rounded-2xl
                      ${isMe
                        ? 'bg-indigo-500 text-white rounded-tr-sm'
                        : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                      }`}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })}
            {typingUsers.length > 0 && typingUsers.map(u => (
              <div key={u} className="text-[11px] text-slate-400 italic px-1">{u} is typing...</div>
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-slate-200 p-3 shrink-0 bg-white">
        <form onSubmit={handleSend} className="relative mb-2 flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            disabled={!hasNearby}
            placeholder={hasNearby ? 'Message the group' : 'Move closer to chat...'}
            className={`flex-1 border rounded-xl py-2 px-3 text-[13px] focus:outline-none transition-all
              ${hasNearby
                ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:bg-white'
                : 'bg-slate-50 border-slate-100 text-slate-300 placeholder-slate-300 cursor-not-allowed'
              }`}
          />
          {hasNearby && (
            <button
              type="submit"
              className="p-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white transition-colors"
            >
              <Send size={14} />
            </button>
          )}
        </form>

        {/* Formatting toolbar */}
        <div className="flex items-center gap-[5px] px-1 overflow-x-auto no-scrollbar">
          <ToolIcon icon={<Smile />} />
          <ToolIcon icon={<Paperclip />} />
          <div className="w-px h-3 bg-slate-200 mx-1" />
          <ToolIcon icon={<Bold />} />
          <ToolIcon icon={<Italic />} />
          <ToolIcon icon={<Strikethrough />} />
          <div className="w-px h-3 bg-slate-200 mx-1" />
          <ToolIcon icon={<Link />} />
          <ToolIcon icon={<Code />} />
        </div>
      </div>
    </div>
  );
}

function ToolIcon({ icon }) {
  return (
    <button type="button" className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-[5px] rounded-lg transition-colors shrink-0">
      {React.cloneElement(icon, { className: 'w-[15px] h-[15px]' })}
    </button>
  );
}
