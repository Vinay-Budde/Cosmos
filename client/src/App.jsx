import { useState, useEffect } from 'react';
import JoinScreen from './components/JoinScreen';
import CosmosView from './components/CosmosView';
import ToastManager from './components/ToastManager';
import { useMediaStream } from './hooks/useMediaStream';

function App() {
  const [phase, setPhase] = useState('join');
  const [playerInfo, setPlayerInfo] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const media = useMediaStream();

  useEffect(() => {
    // Initial hardware check & request
    media.startStream(true, true);

    // Load from localStorage for persistence
    const savedName = localStorage.getItem('cosmos_username');
    const savedColor = localStorage.getItem('cosmos_color') || '#6366f1'; // Fallback color
    
    if (savedName && savedName.trim()) {
      setPlayerInfo({ name: savedName, color: savedColor });
      setPhase('cosmos');
    }
    
    // Smooth transition: small delay to ensure React state commits
    setTimeout(() => setIsInitializing(false), 300);
  }, []);

  if (isInitializing) {
    return (
      <div className="fixed inset-0 bg-[#111120] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Initializing Cosmos</p>
      </div>
    );
  }

  const handleEnter = (name, color) => {
    // Save to localStorage
    localStorage.setItem('cosmos_username', name);
    localStorage.setItem('cosmos_color', color);
    
    setPlayerInfo({ name, color });
    setPhase('cosmos');
  };

  return (
    <>
      <ToastManager />
      {phase === 'join' && (
        <JoinScreen 
          onEnter={handleEnter} 
          {...media}
        />
      )}
      {phase === 'cosmos' && (
        <CosmosView 
          playerInfo={playerInfo} 
          {...media}
        />
      )}
    </>
  );
}

export default App;
