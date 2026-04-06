import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, Settings, X, Info, Check } from 'lucide-react';
import { showToast } from '../utils/toastEmitter';

export default function JoinScreen({
  onEnter,
  localStream, micOn, cameraOn, hasCamera, hasMicrophone, devices, 
  toggleMic, toggleCamera, switchDevice
}) {
  const [name, setName] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showTrouble, setShowTrouble] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, cameraOn]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      onEnter(name.trim(), randomColor);
    }
  };

  const handleTroubleClick = () => {
    setShowTrouble(true);
    showToast("Help is on the way!");
  };

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center font-sans z-[10000] overflow-y-auto">
      <div className="w-full max-w-5xl px-5 sm:px-8 py-8 flex flex-col md:flex-row gap-8 md:gap-12 justify-between items-start md:items-center">

        {/* Left Column: Form & Info */}
        <div className="flex-1 flex flex-col justify-center w-full md:max-w-lg">
          <h1 className="text-[24px] sm:text-[32px] font-extrabold text-[#2a2656] leading-tight mb-3">
            All space conversations in a single Place
          </h1>
          <p className="text-gray-800 text-[14px] sm:text-[15px] font-medium mb-6 sm:mb-8 flex items-center gap-2 flex-wrap">
            Click on "Enter Lobby" to join the campus. Happy Learning! <span className="text-xl">✌️😇</span>
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full sm:w-3/4">
            <div>
              <label className="block text-gray-500 text-[13px] mb-2 font-medium">Your name</label>
              <input
                type="text"
                placeholder="your name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="off"
                className="w-full bg-white border border-[#b4b4cd] rounded-xl px-4 py-3 text-[#2a2656] focus:outline-none focus:border-[#2a2656] focus:ring-1 focus:ring-[#2a2656] shadow-sm transition-all text-base"
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className={`w-full sm:w-40 font-bold rounded-[10px] py-3 mt-2 transition-all tracking-wide text-[15px]
                ${name.trim() ? "bg-[#8b8b99] hover:bg-[black] text-white shadow-md shadow-gray-400/20" : "bg-[#8b8b99] text-white/50 cursor-not-allowed"}
              `}
            >
              Enter lobby
            </button>
          </form>

          <p className="text-[#a1a1aa] text-[11px] mt-8 sm:mt-16 leading-relaxed max-w-sm">
            By using our platform you confirm that you are over 18, and accept our <a href="#" className="underline decoration-[#a1a1aa] hover:text-gray-700">Terms of Use</a> and <a href="#" className="underline decoration-[#a1a1aa] hover:text-gray-700">Privacy Policy</a>.
          </p>
        </div>

        {/* Right Column: Webcam Preview */}
        <div className="flex-1 flex flex-col w-full md:max-w-sm hidden sm:flex">
          {/* Video Box */}
          <div className="w-full aspect-[4/3] bg-slate-900 rounded-xl flex items-end justify-center pb-6 shadow-md relative overflow-hidden">

            {/* Live Media Preview or Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              {cameraOn && hasCamera && localStream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full bg-slate-900/40 flex items-center justify-center">
                  {/* Backdrop for center labels */}
                </div>
              )}
            </div>

            {/* Status Labels Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
              {!cameraOn && (
                <div className="flex flex-col items-center gap-2 mb-2 animate-in fade-in zoom-in duration-300">
                  <VideoOff className="w-8 h-8 text-white/40" />
                  <span className="text-white/60 font-bold text-lg tracking-wide uppercase">Camera Off</span>
                </div>
              )}
              {!micOn && (
                <div className="flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/20 rounded-full border border-rose-500/30">
                    <MicOff className="w-4 h-4 text-rose-400" />
                    <span className="text-rose-400 font-bold text-xs uppercase tracking-widest">Muted</span>
                  </div>
                </div>
              )}
            </div>

            {/* Controls Overlay */}
            <div className="flex items-center justify-center gap-6 z-30 w-full px-12 pb-4">
              <div className="flex flex-col items-center">
                <button
                  onClick={toggleMic}
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all shadow-lg
                    ${micOn ? 'bg-emerald-500 border-white/20 hover:bg-emerald-600' : 'bg-rose-500 border-white/20 hover:bg-rose-600'}
                  `}
                >
                  {micOn ? <Mic className="w-6 h-6 text-white" /> : <MicOff className="w-6 h-6 text-white" />}
                </button>
                <div className={`w-8 h-1 mt-3 rounded-full opacity-80 transition-colors ${micOn ? 'bg-emerald-400 animate-pulse' : 'bg-white'}`} />
              </div>

              <div className="flex flex-col items-center">
                <button
                  onClick={toggleCamera}
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all shadow-lg
                    ${cameraOn ? 'bg-emerald-500 border-white/20 hover:bg-emerald-600' : 'bg-rose-500 border-white/20 hover:bg-rose-600'}
                  `}
                >
                  {cameraOn ? <Video className="w-6 h-6 text-white" /> : <VideoOff className="w-6 h-6 text-white" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="bg-[#f0f0f5] hover:bg-[#e4e4eb] text-[#2a2656] font-bold text-[13px] px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Device settings
            </button>
            <button 
              onClick={handleTroubleClick}
              className="text-[#2a2656] hover:text-[#1c1938] font-bold text-[13px] transition-colors"
            >
              Having trouble?
            </button>
          </div>
        </div>

        {/* Mobile-only: compact mic/camera toggles */}
        <div className="sm:hidden flex items-center gap-4 mt-2">
          <button
            onClick={toggleMic}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[13px] border-2 transition-all
              ${micOn ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-rose-500 border-rose-400 text-white'}
            `}
          >
            {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            {micOn ? 'Mic On' : 'Mic Off'}
          </button>
          <button
            onClick={toggleCamera}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[13px] border-2 transition-all
              ${cameraOn ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-rose-500 border-rose-400 text-white'}
            `}
          >
            {cameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            {cameraOn ? 'Cam On' : 'Cam Off'}
          </button>
        </div>
      </div>

      {/* Device Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)} />
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-[#2a2656] text-lg">Device Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-6">
              {/* Camera Selection */}
              <div>
                <label className="block text-slate-400 text-[11px] font-black uppercase tracking-widest mb-3">Camera</label>
                <div className="flex flex-col gap-2">
                  {devices.filter(d => d.kind === 'videoinput').map(device => (
                    <button
                      key={device.deviceId}
                      onClick={() => switchDevice('videoinput', device.deviceId)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-[14px] font-bold text-left
                        ${localStream?.getVideoTracks()[0]?.label === device.label
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'}
                      `}
                    >
                      <span className="truncate pr-4">{device.label || `Camera ${device.deviceId.slice(0, 5)}`}</span>
                      {localStream?.getVideoTracks()[0]?.label === device.label && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  ))}
                  {devices.filter(d => d.kind === 'videoinput').length === 0 && (
                    <p className="text-slate-400 text-sm italic italic">No cameras detected</p>
                  )}
                </div>
              </div>

              {/* Microphone Selection */}
              <div>
                <label className="block text-slate-400 text-[11px] font-black uppercase tracking-widest mb-3">Microphone</label>
                <div className="flex flex-col gap-2">
                  {devices.filter(d => d.kind === 'audioinput').map(device => (
                    <button
                      key={device.deviceId}
                      onClick={() => switchDevice('audioinput', device.deviceId)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-[14px] font-bold text-left
                        ${localStream?.getAudioTracks()[0]?.label === device.label
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                          : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'}
                      `}
                    >
                      <span className="truncate pr-4">{device.label || `Mic ${device.deviceId.slice(0, 5)}`}</span>
                      {localStream?.getAudioTracks()[0]?.label === device.label && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  ))}
                   {devices.filter(d => d.kind === 'audioinput').length === 0 && (
                    <p className="text-slate-400 text-sm italic">No microphones detected</p>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="bg-[#2a2656] text-white font-bold px-6 py-2 rounded-xl hover:bg-black transition-all shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Troubleshooting Guide Modal */}
      {showTrouble && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowTrouble(false)} />
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center">
                  <Info className="w-5 h-5 text-amber-700" />
                </div>
                <h3 className="font-bold text-[#2a2656] text-lg">Troubleshooting Guide</h3>
              </div>
              <button onClick={() => setShowTrouble(false)} className="p-1 hover:bg-amber-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[60vh]">
              <TroubleStep number="1" title="Check Permissions" text="Make sure your browser has permission to access your camera and microphone. Look for a lock icon in your browser's address bar." />
              <TroubleStep number="2" title="Check Connections" text="Ensure your camera and microphone are properly plugged in and turned on (some headsets have a physical mute switch)." />
              <TroubleStep number="3" title="Refresh the Page" text="Sometimes a simple refresh can fix connection issues with your hardware drivers." />
              <TroubleStep number="4" title="Close Other Apps" text="Make sure no other apps (like Zoom, Meet, or Skype) are using your camera or microphone." />
              <TroubleStep number="5" title="Hardware Selector" text="Use the 'Device Settings' button to make sure the correct camera and mic are selected." />
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-center">
              <button 
                onClick={() => setShowTrouble(false)}
                className="bg-slate-700 text-white font-bold w-full py-3 rounded-xl hover:bg-slate-900 transition-all shadow-md"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TroubleStep({ number, title, text }) {
  return (
    <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
      <div className="w-8 h-8 rounded-full bg-[#2a2656] text-white flex items-center justify-center font-black shrink-0 shadow-sm">{number}</div>
      <div>
        <h4 className="font-extrabold text-[#2a2656] text-[15px] mb-1">{title}</h4>
        <p className="text-slate-500 text-[13px] leading-relaxed font-medium">{text}</p>
      </div>
    </div>
  );
}
