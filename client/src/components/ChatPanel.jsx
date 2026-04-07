import { useState, useEffect, useRef } from 'react';
import { Send, X } from 'lucide-react';

export default function ChatPanel({ partner, roomId, socket, myUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    if (roomId) {
      // clear messages or fetch history
      fetch(`http://localhost:5000/api/messages/${roomId}`)
        .then(r => r.json())
        .then(data => setMessages(data))
        .catch(e => console.error(e));
    } else {
      setMessages([]);
    }
  }, [roomId]);

  useEffect(() => {
    if (!socket) return;
    
    const handleMessage = (msg) => {
      // If a message has a roomId and it matches our current roomId, or if it doesn't have a roomId (old compat), we add it.
      // But actually we should only add messages meant for this room.
      if (roomId && msg.roomId === roomId) {
        setMessages(prev => [...prev, msg]);
      }
    };
    
    socket.on('receive_message', handleMessage);
    
    return () => {
      socket.off('receive_message', handleMessage);
    };
  }, [socket, roomId]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !socket || !roomId) return;

    socket.emit('send_message', { roomId, message: inputValue.trim() });
    setInputValue('');
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between shadow-sm z-10 shrink-0">
        <h2 className="font-semibold text-slate-800">
           {roomId === 'general' ? 'General Chat' : 'Chat'}
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      { partner && (
        <div className="p-4 flex flex-col items-center border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="w-16 h-16 rounded-full mb-2 border-4 border-white shadow-sm flex items-center justify-center overflow-hidden bg-slate-200">
             <div className="w-full h-full" style={{ backgroundColor: partner.color }} />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">This is the beginning of your chat history with <span className="text-blue-500">@{partner.username}</span></h3>
          <p className="text-xs text-slate-500 mt-1">Send messages, attachments, links, emojis, and more.</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === myUser?.socketId;
          return (
            <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <div className="flex items-center gap-2 mb-1">
                 {!isMe && <div className="w-4 h-4 rounded-full bg-slate-300" />}
                 <span className="text-[11px] font-semibold text-slate-600">{msg.sender}</span>
                 <span className="text-[9px] text-slate-400">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </span>
              </div>
              <div className={`px-4 py-2 text-sm max-w-[85%] leading-relaxed ${isMe ? "bg-slate-800 text-white rounded-2xl rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-2xl rounded-bl-sm"}`}>
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 shrink-0">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Message the group"
            className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-400 rounded-lg py-3 pl-4 pr-12 text-sm text-slate-800 focus:outline-none transition-colors"
          />
          <button 
            type="submit"
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md transition-colors ${inputValue.trim() ? "text-blue-500 hover:bg-blue-50" : "text-slate-300 pointer-events-none"}`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
