import React, { useState } from 'react';
import { BarVisualizer, useVoiceAssistant } from '@livekit/components-react';

interface GameScreenProps {
  playerName: string;
  onEndGame: () => void;
}

export function GameScreen({ playerName, onEndGame }: GameScreenProps) {
  const { state, audioTrack } = useVoiceAssistant();

  // Simplified state check to avoid lint errors with unknown properties
  // We'll just check if we are connected and have an audio track
  const isConnected = state === 'listening' || state === 'thinking' || state === 'speaking';

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[var(--neon-bg)]">
      {/* Scanline Overlay */}
      <div className="scanlines pointer-events-none absolute inset-0 z-10 opacity-20"></div>

      {/* Header */}
      <header className="z-20 flex items-center justify-between border-b border-[var(--neon-secondary)] bg-black/50 p-4 backdrop-blur-md">
        <div className="neon-text-cyan text-xl font-bold tracking-widest text-[var(--neon-secondary)] uppercase">
          🎤 Improv Battle Arena
        </div>
        <div className="font-mono text-sm text-white">
          PLAYER: <span className="text-[var(--neon-primary)]">{playerName}</span>
        </div>
      </header>

      {/* Main Arena */}
      <main className="relative z-20 flex flex-1 flex-col items-center justify-center p-8">
        {/* Round Counter */}
        <div className="neon-border-cyan absolute top-8 right-8 flex h-24 w-24 items-center justify-center rounded-full bg-black/40 p-4">
          <div className="text-center">
            <div className="text-xs text-[var(--neon-secondary)]">ROUND</div>
            <div className="neon-text-cyan text-3xl font-bold text-white">?</div>
          </div>
        </div>

        {/* Visualizer */}
        <div className="mb-12 flex h-64 w-full max-w-3xl items-center justify-center">
          <div className="neon-border flex h-full w-full items-center justify-center rounded-xl bg-black/30 p-4">
            {isConnected && audioTrack ? (
              <BarVisualizer
                state={state}
                barCount={30}
                trackRef={audioTrack}
                className="h-full w-full"
                style={{ height: '100%', width: '100%' }}
                options={{}}
              />
            ) : (
              <div className="animate-pulse text-white">CONNECTING TO STAGE...</div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-6">
          <button
            onClick={onEndGame}
            className="rounded border-2 border-red-500 bg-transparent px-8 py-4 font-bold tracking-widest text-red-500 uppercase shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all duration-300 hover:bg-red-500 hover:text-white"
          >
            End Show
          </button>

          {/* Mic Indicator (Passive) */}
          <div
            className={`flex animate-pulse items-center gap-2 rounded border-2 border-[var(--neon-secondary)] px-8 py-4 font-bold tracking-widest text-[var(--neon-secondary)] uppercase shadow-[0_0_15px_rgba(0,224,255,0.5)] transition-all duration-300`}
          >
            <span className="h-3 w-3 rounded-full bg-current"></span>
            MIC LIVE
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="z-20 p-2 text-center font-mono text-xs text-gray-600">
        POWERED BY LIVEKIT AGENTS • DAY 10 CHALLENGE
      </footer>
    </div>
  );
}
