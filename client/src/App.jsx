import { useState, useEffect } from 'react';
import JoinScreen from './components/JoinScreen';
import CosmosView from './components/CosmosView';
import ToastManager from './components/ToastManager';
import { useMediaStream } from './hooks/useMediaStream';

function App() {
  const [phase, setPhase] = useState('join');
  const [playerInfo, setPlayerInfo] = useState(null);
  const media = useMediaStream();

  useEffect(() => {
    // Initial hardware check & request
    media.startStream(true, true);

    // Load from localStorage for persistence
    const savedName = localStorage.getItem('cosmos_username');
    const savedColor = localStorage.getItem('cosmos_color');
    
    if (savedName && savedColor) {
      setPlayerInfo({ name: savedName, color: savedColor });
      setPhase('cosmos');
    }
  }, []);

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
