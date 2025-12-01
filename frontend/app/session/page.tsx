'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// import { motion } from 'framer-motion';
import { AnimatePresence, motion } from 'framer-motion';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { GameScreen } from '@/components/GameScreen';

function SessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const playerName = searchParams.get('name') || 'Unknown Agent';

  const [token, setToken] = useState<string | undefined>(undefined);
  const [url, setUrl] = useState<string | undefined>(undefined);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasConnected, setHasConnected] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch(
        `/api/token?room=improv-${Math.random().toString(36).substring(7)}&username=${encodeURIComponent(playerName)}`
      );
      const data = await response.json();
      setToken(data.accessToken);
      setUrl(data.url);
      setHasConnected(true);
    } catch (e) {
      console.error('Failed to join:', e);
      setIsConnecting(false);
    }
  };

  if (hasConnected && token && url) {
    return (
      <LiveKitRoom
        token={token}
        serverUrl={url}
        connect={true}
        audio={true}
        video={false}
        className="h-screen w-screen"
      >
        <GameScreen playerName={playerName} />
        <RoomAudioRenderer />
      </LiveKitRoom>
    );
  }

  return (
    <main className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-black font-sans text-white">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 opacity-40"
        style={{
          backgroundImage: 'url(/bg-arena.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Scanline Overlay */}
      <div className="scanline z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-20 flex w-full max-w-md flex-col items-center px-4"
      >
        <div className="w-full rounded-2xl border border-pink-500/30 bg-black/60 p-8 text-center shadow-[0_0_30px_rgba(255,0,255,0.1)] backdrop-blur-md">
          <h2 className="mb-2 text-3xl font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
            Welcome, {playerName}
          </h2>
          <p className="mb-8 text-sm text-gray-400">Ready to enter the battle arena?</p>

          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="mb-6 w-full rounded-lg bg-cyan-400 py-4 font-black tracking-wider text-black uppercase shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all hover:bg-cyan-300 hover:shadow-[0_0_30px_rgba(0,255,255,0.6)] disabled:cursor-wait disabled:opacity-50"
          >
            {isConnecting ? 'INITIALIZING...' : 'CONNECT TO AGENT'}
          </button>

          <button
            onClick={() => router.push('/')}
            className="text-xs text-gray-500 transition-colors hover:text-gray-300"
          >
            Back to lobby
          </button>
        </div>
      </motion.div>
    </main>
  );
}

export default function SessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-black font-mono text-cyan-500">
          LOADING SYSTEM...
        </div>
      }
    >
      <SessionContent />
    </Suspense>
  );
}
