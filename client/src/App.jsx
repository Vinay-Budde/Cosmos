import { useState, useEffect, useRef } from 'react';
import JoinScreen from './components/JoinScreen';
import CosmosView from './components/CosmosView';
import ToastManager from './components/ToastManager';
import { useMediaStream } from './hooks/useMediaStream';

function App() {
  const [phase, setPhase] = useState('join');
  const [playerInfo, setPlayerInfo] = useState(null);
  const media = useMediaStream();

  // Start stream once on mount — we call via a stable ref to avoid
  // re-triggering if the hook identity changes between renders.
  const startStreamRef = useRef(media.startStream);
  useEffect(() => {
    startStreamRef.current(true, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <ToastManager />
      {phase === 'join' && (
        <JoinScreen 
          onEnter={(name, color) => {
            setPlayerInfo({ name, color });
            setPhase('cosmos');
          }} 
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
