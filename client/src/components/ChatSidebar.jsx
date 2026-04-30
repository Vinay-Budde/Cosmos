import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Smile, Paperclip, Bold, Italic, Strikethrough, Link, Code, Send } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';

export default function ChatSidebar({ open, onClose, socket, myUser, messages, typingUsers, hasNearby, nearbyUsers = [], partner }) {
  const [inputValue, setInputValue] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setShowEmojiPicker(false);
    }
  }, [open]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (socket && hasNearby && nearbyUsers.length > 0) {
      const targetIds = nearbyUsers.map(u => u.socketId);
      socket.emit('typing', { targetIds, username: myUser?.username });
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || !socket || !hasNearby || nearbyUsers.length === 0) return;
    const targetIds = nearbyUsers.map(u => u.socketId);
    socket.emit('send_message', { targetIds, message: text });
    setInputValue('');
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const onEmojiClick = (emojiData) => {
    setInputValue(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  // ── Formatting helpers ──────────────────────────────────────────
  const wrapSelection = useCallback((before, after = before) => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = inputValue.slice(start, end);
    const newText = inputValue.slice(0, start) + before + selected + after + inputValue.slice(end);
    setInputValue(newText);
    // Restore caret after state update
    requestAnimationFrame(() => {
      el.focus();
      const caret = selected ? start + before.length + selected.length + after.length : start + before.length;
      el.setSelectionRange(caret, caret);
    });
  }, [inputValue]);

  const insertLink = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = inputValue.slice(start, end);
    const label = selected || 'link text';
    const newText = inputValue.slice(0, start) + `[${label}](url)` + inputValue.slice(end);
    setInputValue(newText);
    requestAnimationFrame(() => {
      el.focus();
      // Select "url" for easy replacement
      const urlStart = start + label.length + 3;
      el.setSelectionRange(urlStart, urlStart + 3);
    });
  }, [inputValue]);

  const handleFileAttach = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*,.pdf,.doc,.docx,.txt';
    input.onchange = () => {
      if (input.files?.[0]) {
        const fname = input.files[0].name;
        setInputValue(prev => prev + `[📎 ${fname}]`);
        inputRef.current?.focus();
      }
    };
    input.click();
  };

  const formatTime = (ts) => {
    try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  // Render message content with basic markdown formatting
  const renderContent = (text) => {
    if (!text) return null;
    // Bold **text**
    let processed = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/`(.*?)`/g, '<code style="background:rgba(0,0,0,0.12);padding:1px 4px;border-radius:3px;font-size:11px">$1</code>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="text-decoration:underline;opacity:0.8">$1</a>');
    return <span dangerouslySetInnerHTML={{ __html: processed }} />;
  };

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
            <h2 className="text-slate-800 font-bold text-[15px] tracking-wide">Proximity Chat</h2>
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
            <div className="m-auto flex flex-col items-center justify-center p-8 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
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
                    Start chatting with{' '}
                    <span style={{ color: partner.color }} className="font-black">@{partner.username}</span>!
                  </p>
                  <p className="text-slate-400 text-[12px] mt-2 leading-relaxed">
                    You're in proximity range. Say hello! 👋
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
            <div className="p-3 space-y-3 flex flex-col justify-end min-h-full">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === myUser?.socketId;
                const showMeta = idx === 0 || messages[idx - 1]?.senderId !== msg.senderId;
                return (
                  <div key={`${msg.senderId}_${msg.timestamp}_${idx}`} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {showMeta && (
                      <div className={`flex items-center gap-1.5 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                        {!isMe && (
                          <div
                            className="w-[26px] h-[26px] rounded-full shrink-0 flex items-center justify-center border border-white shadow-sm"
                            style={{ backgroundColor: msg.color }}
                          >
                            <span className="text-white text-[10px] font-bold">{msg.sender.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <span className="font-bold text-[12px] text-slate-700">{isMe ? 'You' : msg.sender}</span>
                        <span className="text-[10px] text-slate-400">{formatTime(msg.timestamp)}</span>
                      </div>
                    )}
                    <div
                      className={`px-3 py-2 text-[13px] max-w-[85%] leading-relaxed shadow-sm rounded-2xl break-words
                        ${isMe
                          ? 'bg-indigo-500 text-white rounded-tr-sm'
                          : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                        }`}
                    >
                      {renderContent(msg.message)}
                    </div>
                  </div>
                );
              })}
              {typingUsers.length > 0 && typingUsers.map(u => (
                <div key={u} className="flex items-center gap-2 text-slate-400 text-[11px] italic px-1">
                  <div className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  {u} is typing...
                </div>
              ))}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div
          className="relative border-t border-slate-200 p-3 shrink-0 bg-white"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Emoji picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 right-0 z-[600]">
              <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)} />
              <div className="relative flex justify-center mb-1">
                <div className="shadow-2xl rounded-2xl overflow-hidden">
                  <EmojiPicker
                    onEmojiClick={onEmojiClick}
                    autoFocusSearch={false}
                    theme={Theme.LIGHT}
                    width={280}
                    height={340}
                    searchPlaceHolder="Search emojis..."
                    previewConfig={{ showPreview: false }}
                    skinTonesDisabled
                  />
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSend} className="relative mb-2 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e); }}
              disabled={!hasNearby}
              placeholder={hasNearby ? 'Message nearby users...' : 'Move closer to chat...'}
              className={`flex-1 border rounded-xl py-2.5 px-3 text-[13px] focus:outline-none transition-all
                ${hasNearby
                  ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:bg-white'
                  : 'bg-slate-50 border-slate-100 text-slate-300 placeholder-slate-300 cursor-not-allowed'
                }`}
            />
            {hasNearby && (
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className={`p-2 rounded-xl transition-all shrink-0 ${inputValue.trim() ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
              >
                <Send size={14} />
              </button>
            )}
          </form>

          {/* Formatting toolbar */}
          <div className="flex items-center gap-[4px] px-1 overflow-x-auto no-scrollbar">
            <ToolIcon
              icon={<Smile />}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              active={showEmojiPicker}
              title="Emoji"
            />
            <ToolIcon
              icon={<Paperclip />}
              onClick={handleFileAttach}
              title="Attach file"
            />
            <div className="w-px h-3 bg-slate-200 mx-1" />
            <ToolIcon icon={<Bold />} onClick={() => wrapSelection('**')} title="Bold (**text**)" />
            <ToolIcon icon={<Italic />} onClick={() => wrapSelection('*')} title="Italic (*text*)" />
            <ToolIcon icon={<Strikethrough />} onClick={() => wrapSelection('~~')} title="Strikethrough (~~text~~)" />
            <div className="w-px h-3 bg-slate-200 mx-1" />
            <ToolIcon icon={<Link />} onClick={insertLink} title="Insert link" />
            <ToolIcon icon={<Code />} onClick={() => wrapSelection('`')} title="Code (`code`)" />
          </div>
        </div>
      </div>
    </>
  );
}

function ToolIcon({ icon, onClick, active, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        p-[5px] rounded-lg transition-all shrink-0
        ${active
          ? 'text-indigo-600 bg-indigo-50 border border-indigo-100'
          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
        }
      `}
    >
      {React.cloneElement(icon, { className: 'w-[15px] h-[15px]' })}
    </button>
  );
}
