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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

// ── Production Error Boundary ──────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-[#111120] flex flex-col items-center justify-center p-8 text-center font-sans">
          <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl font-black text-white uppercase tracking-widest mb-2">Something went wrong</h1>
          <p className="text-slate-400 text-sm max-w-xs mb-8 leading-relaxed">
            The Cosmos encountered a critical error. This usually happens due to browser incompatibility or network issues.
          </p>
          <div className="bg-black/40 border border-white/5 rounded-xl p-4 mb-8 w-full max-w-sm text-left font-mono">
             <p className="text-rose-400 text-[10px] uppercase font-black mb-1">Diagnostic Info:</p>
             <p className="text-white/40 text-[10px] break-all">{this.state.error?.toString()}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-xl"
          >
            Refresh & Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default App;
