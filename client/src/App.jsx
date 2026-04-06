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
  }, []);

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
