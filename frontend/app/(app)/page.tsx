'use client';

import { useCallback, useState } from 'react';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { GameScreen } from '@/components/improv/game-screen';
import { JoinScreen } from '@/components/improv/join-screen';

export default function Page() {
  const [gameState, setGameState] = useState<'joined' | 'playing'>('joined');
  const [playerName, setPlayerName] = useState('');
  const [token, setToken] = useState<string | undefined>(undefined);
  const [url, setUrl] = useState<string | undefined>(undefined);

  const handleJoin = useCallback(async (name: string) => {
    setPlayerName(name);

    try {
      const response = await fetch(
        `/api/token?room=improv-${Math.random().toString(36).substring(7)}&username=${encodeURIComponent(name)}`
      );
      const data = await response.json();
      setToken(data.accessToken);
      setUrl(data.url);
      setGameState('playing');
    } catch (e) {
      console.error('Failed to join:', e);
    }
  }, []);

  const handleEndGame = useCallback(() => {
    setGameState('joined');
    setToken(undefined);
    setPlayerName('');
  }, []);

  if (gameState === 'joined') {
    return <JoinScreen onJoin={handleJoin} />;
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={url}
      connect={true}
      audio={true}
      video={false}
      onDisconnected={handleEndGame}
      className="h-screen w-screen"
    >
      <GameScreen playerName={playerName} onEndGame={handleEndGame} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
