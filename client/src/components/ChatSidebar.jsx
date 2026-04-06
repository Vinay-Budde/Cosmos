import React, { useState, useRef, useEffect } from 'react';
import { X, Smile, Paperclip, Bold, Italic, Strikethrough, Link, Code, Send, Search } from 'lucide-react';

const EMOJI_CATEGORIES = [
  { label: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰'] },
  { label: 'Gestures', emojis: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾'] },
  { label: 'Animals', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🕸', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐄', '🐎', '🐖', '🐏', '🐑', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔'] },
  { label: 'Food', emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌽', '🥕', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🥗', '🥘', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🥤'] },
];

export default function ChatSidebar({ open, onClose, socket, myUser, messages, typingUsers, hasNearby, nearbyUsers = [], partner }) {
  const [inputValue, setInputValue] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const endRef = useRef(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Handle click outside to close emoji picker
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showEmojiPicker]);

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
    setShowEmojiPicker(false);
  };

  const addEmoji = (emoji) => {
    setInputValue(prev => prev + emoji);
    // Don't close so they can add multiple emojis quickly!
  };

  const filteredEmojis = EMOJI_CATEGORIES.map(cat => ({
    ...cat,
    emojis: cat.emojis.filter(e => emojiSearch === '' || e.includes(emojiSearch))
  })).filter(cat => cat.emojis.length > 0);

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-[400] backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`
          bg-white flex flex-col z-[500] shadow-2xl overflow-hidden
          md:relative md:h-full md:transition-all md:duration-300 md:ease-in-out md:shrink-0
          fixed left-0 right-0 bottom-0 transition-all duration-300 ease-in-out
          rounded-t-2xl md:rounded-none
          ${open
            ? 'md:w-[300px] md:min-w-[300px] md:border-l md:border-gray-200 top-[30%] md:top-auto'
            : 'md:w-0 md:min-w-0 md:border-none top-full md:top-auto'
          }
        `}
        style={{ borderLeft: 'none' }}
      >
        {/* Mobile drag handle */}
        <div className="md:hidden flex justify-center pt-2 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

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
        <div className="flex-1 overflow-y-auto flex flex-col bg-white custom-scrollbar relative">
          {!hasNearby ? (
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
                    <span style={{ color: partner.color }} className="font-black">@{partner.username}</span>.
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
                  <p className="text-slate-600 font-semibold text-[13px]">Say something to get started!</p>
                </>
              )}
            </div>
          ) : (
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

          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div 
              ref={pickerRef}
              className="absolute left-4 right-4 bottom-4 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[600] flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 duration-200"
              style={{ height: '240px' }}
            >
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search emoji" 
                  autoFocus
                  value={emojiSearch}
                  onChange={(e) => setEmojiSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-[12px] flex-1 text-slate-600"
                />
              </div>
              <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                {filteredEmojis.map(cat => (
                  <div key={cat.label} className="mb-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{cat.label}</h4>
                    <div className="grid grid-cols-6 sm:grid-cols-7 gap-1">
                      {cat.emojis.map(e => (
                        <button
                          key={e}
                          onClick={() => addEmoji(e)}
                          className="w-8 h-8 flex items-center justify-center text-xl hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div
          className="border-t border-slate-200 p-3 shrink-0 bg-white"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
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
            <ToolIcon 
              icon={<Smile />} 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
              active={showEmojiPicker}
            />
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
    </>
  );
}

function ToolIcon({ icon, onClick, active }) {
  return (
    <button 
      type="button" 
      onClick={onClick}
      className={`p-[5px] rounded-lg transition-colors shrink-0
        ${active ? 'bg-indigo-50 text-indigo-500' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}
      `}
    >
      {React.cloneElement(icon, { className: 'w-[15px] h-[15px]' })}
    </button>
  );
}
