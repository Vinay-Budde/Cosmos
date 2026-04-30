import { useState, useEffect, useRef } from 'react';
import { Send, X, Smile } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';

const API_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function ChatPanel({ partner, roomId, socket, myUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const endOfMessagesRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch history and clear on roomId change
  useEffect(() => {
    if (roomId) {
      fetch(`${API_URL}/api/messages/${roomId}`)
        .then(r => r.json())
        .then(data => Array.isArray(data) ? setMessages(data) : setMessages([]))
        .catch(e => { console.error('[ChatPanel] fetch error:', e); setMessages([]); });
    } else {
      setMessages([]);
    }
  }, [roomId]);

  // Listen for incoming messages for this room
  useEffect(() => {
    if (!socket) return;
    const handleMessage = (msg) => {
      if (roomId && msg.roomId === roomId) {
        setMessages(prev => {
          // Deduplicate by timestamp+sender
          const key = `${msg.sender}_${msg.timestamp}`;
          const exists = prev.some(m => `${m.sender}_${m.timestamp}` === key);
          return exists ? prev : [...prev, msg];
        });
      }
    };
    socket.on('receive_message', handleMessage);
    return () => socket.off('receive_message', handleMessage);
  }, [socket, roomId]);

  // Auto-scroll to bottom
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || !socket || !roomId) return;
    socket.emit('send_message', { roomId, message: text });
    setInputValue('');
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const onEmojiClick = (emojiData) => {
    setInputValue(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const formatTime = (ts) => {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <span className="text-white text-sm font-black">#</span>
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm leading-none">
              {roomId === 'general' ? 'General Chat' : roomId || 'Chat'}
            </h2>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Everyone in the space</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Partner info (DM scenario) */}
      {partner && (
        <div className="p-4 flex flex-col items-center border-b border-slate-100 bg-slate-50 shrink-0">
          <div
            className="w-16 h-16 rounded-full mb-2 border-4 border-white shadow-md flex items-center justify-center text-white text-2xl font-black"
            style={{ backgroundColor: partner.color }}
          >
            {partner.username?.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-sm font-semibold text-slate-800">
            Beginning of chat with{' '}
            <span style={{ color: partner.color }} className="font-black">@{partner.username}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">Send messages, emojis, and more.</p>
        </div>
      )}

      {/* Welcome state */}
      {messages.length === 0 && !partner && (
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center">
            <span className="text-2xl">#</span>
          </div>
          <p className="text-slate-600 font-semibold text-sm">Welcome to General Chat!</p>
          <p className="text-slate-400 text-xs leading-relaxed max-w-[200px]">
            This is the beginning of the general channel. Say hello to everyone!
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === myUser?.socketId;
          const showAvatar = !isMe && (idx === 0 || messages[idx - 1]?.senderId !== msg.senderId);
          return (
            <div key={`${msg.senderId}_${msg.timestamp}_${idx}`} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {showAvatar && !isMe && (
                <div className="flex items-center gap-2 mb-1 ml-1">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-sm"
                    style={{ backgroundColor: msg.color || '#6366f1' }}
                  >
                    {msg.sender?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[11px] font-bold text-slate-600">{msg.sender}</span>
                  <span className="text-[9px] text-slate-400">{formatTime(msg.timestamp)}</span>
                </div>
              )}
              {isMe && (
                <div className="flex items-center gap-1.5 mb-1 mr-1">
                  <span className="text-[9px] text-slate-400">{formatTime(msg.timestamp)}</span>
                  <span className="text-[11px] font-bold text-slate-600">You</span>
                </div>
              )}
              <div
                className={`px-3.5 py-2 text-[13px] max-w-[85%] leading-relaxed shadow-sm break-words
                  ${isMe
                    ? 'bg-indigo-500 text-white rounded-2xl rounded-tr-sm'
                    : 'bg-slate-100 text-slate-800 rounded-2xl rounded-tl-sm'
                  }`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="relative shrink-0">
          <div className="fixed inset-0 z-[590]" onClick={() => setShowEmojiPicker(false)} />
          <div className="absolute bottom-full right-0 mb-2 z-[600] shadow-2xl">
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              autoFocusSearch={false}
              theme={Theme.LIGHT}
              width={300}
              height={380}
              searchPlaceHolder="Search emojis..."
              previewConfig={{ showPreview: false }}
              skinTonesDisabled
            />
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 shrink-0">
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(v => !v)}
            className={`p-2 rounded-lg transition-colors shrink-0 ${showEmojiPicker ? 'text-indigo-500 bg-indigo-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
          >
            <Smile className="w-4 h-4" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e); }}
            placeholder="Message #general"
            className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-400 rounded-xl py-2.5 pl-3 pr-3 text-sm text-slate-800 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className={`p-2 rounded-xl transition-all shrink-0 ${inputValue.trim() ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm' : 'text-slate-300 cursor-not-allowed'}`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
