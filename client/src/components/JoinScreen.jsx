import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, Info } from 'lucide-react';

export default function JoinScreen({
  onEnter,
  localStream, micOn, cameraOn, hasCamera, hasMicrophone, toggleMic, toggleCamera
}) {
  const [name, setName] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, cameraOn]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      // Pick a random hex color since the color picker is removed to match the UI perfectly
      const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      onEnter(name.trim(), randomColor);
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center font-sans z-[10000]">
      <div className="w-full max-w-5xl px-8 flex flex-col md:flex-row gap-12 justify-between">

        {/* Left Column: Form & Info */}
        <div className="flex-1 flex flex-col justify-center max-w-lg">
          <h1 className="text-[32px] font-extrabold text-[#2a2656] leading-tight mb-3">
            All space conversations in a single Place
          </h1>
          <p className="text-gray-800 text-[15px] font-medium mb-8 flex items-center gap-2">
            Click on "Enter Lobby" to join the campus. Happy Learning! <span className="text-xl">✌️😇</span>
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-3/4">
            <div>
              <label className="block text-gray-500 text-[13px] mb-2 font-medium">Your name</label>
              <input
                type="text"
                placeholder="your name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-white border border-[#b4b4cd] rounded-xl px-4 py-3 text-[#2a2656] focus:outline-none focus:border-[#2a2656] focus:ring-1 focus:ring-[#2a2656] shadow-sm transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className={`w-40 font-bold rounded-[10px] py-3 mt-4 transition-all tracking-wide text-[15px]
                ${name.trim() ? "bg-[#8b8b99] hover:bg-[black] text-white shadow-md shadow-gray-400/20" : "bg-[#8b8b99] text-white/50 cursor-not-allowed"}
              `}
            >
              Enter lobby
            </button>
          </form>

          <p className="text-[#a1a1aa] text-[11px] mt-16 leading-relaxed max-w-sm">
            By using our platform you confirm that you are over 18, and accept our <a href="#" className="underline decoration-[#a1a1aa] hover:text-gray-700">Terms of Use</a> and <a href="#" className="underline decoration-[#a1a1aa] hover:text-gray-700">Privacy Policy</a>.
          </p>
        </div>

        {/* Right Column: Webcam Preview Mockup */}
        <div className="flex-1 flex flex-col max-w-sm">
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
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                  <span className="text-white/20 font-bold text-lg">Camera Off</span>
                </div>
              )}
            </div>

            {/* Controls Overlay */}
            <div className="flex items-center justify-center gap-6 z-10 w-full px-12 pb-4">
              <div className="flex flex-col items-center">
                <button
                  onClick={toggleMic}
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all shadow-lg
                       ${micOn ? 'bg-emerald-500 border-white/20 hover:bg-emerald-600' : 'bg-rose-500 border-white/20 hover:bg-rose-600'}
                     `}
                >
                  {micOn ? <Mic className="w-6 h-6 text-white" /> : <MicOff className="w-6 h-6 text-white" />}
                </button>
                <div className="w-8 h-1 bg-white mt-3 rounded-full opacity-80" />
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
            <button className="bg-[#f0f0f5] hover:bg-[#e4e4eb] text-[#2a2656] font-bold text-[13px] px-6 py-2.5 rounded-lg transition-colors">
              Device settings
            </button>
            <button className="text-[#2a2656] hover:text-[#1c1938] font-bold text-[13px] transition-colors">
              Having trouble?
            </button>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            {!hasCamera && (
              <div className="bg-[#fffdf2] border border-[#fef3c7] rounded-lg p-3 flex items-start gap-3">
                <div className="bg-[#f59e0b] rounded-full w-5 h-5 flex items-center justify-center text-white font-bold text-[12px] shrink-0 mt-0.5">!</div>
                <p className="text-[#d97706] text-[13px] font-medium leading-snug">Looks like there is <span className="font-bold text-[#b45309]">no camera</span> connected</p>
              </div>
            )}

            {!hasMicrophone && (
              <div className="bg-[#fffdf2] border border-[#fef3c7] rounded-lg p-3 flex items-start gap-3">
                <div className="bg-[#f59e0b] rounded-full w-5 h-5 flex items-center justify-center text-white font-bold text-[12px] shrink-0 mt-0.5">!</div>
                <p className="text-[#d97706] text-[13px] font-medium leading-snug">Looks like there is <span className="font-bold text-[#b45309]">no microphone</span> connected</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
