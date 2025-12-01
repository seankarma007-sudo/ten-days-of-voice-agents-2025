import React, { useState } from 'react';
import { useVoiceAssistant, BarVisualizer } from '@livekit/components-react';

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
        <div className="flex flex-col h-screen bg-[var(--neon-bg)] relative overflow-hidden">
            {/* Scanline Overlay */}
            <div className="absolute inset-0 scanlines z-10 opacity-20 pointer-events-none"></div>

            {/* Header */}
            <header className="z-20 p-4 border-b border-[var(--neon-secondary)] bg-black/50 backdrop-blur-md flex justify-between items-center">
                <div className="text-[var(--neon-secondary)] font-bold text-xl tracking-widest uppercase neon-text-cyan">
                    🎤 Improv Battle Arena
                </div>
                <div className="text-white font-mono text-sm">
                    PLAYER: <span className="text-[var(--neon-primary)]">{playerName}</span>
                </div>
            </header>

            {/* Main Arena */}
            <main className="flex-1 z-20 flex flex-col items-center justify-center p-8 relative">

                {/* Round Counter */}
                <div className="absolute top-8 right-8 neon-border-cyan p-4 rounded-full w-24 h-24 flex items-center justify-center bg-black/40">
                    <div className="text-center">
                        <div className="text-xs text-[var(--neon-secondary)]">ROUND</div>
                        <div className="text-3xl font-bold text-white neon-text-cyan">?</div>
                    </div>
                </div>

                {/* Visualizer */}
                <div className="w-full max-w-3xl h-64 flex items-center justify-center mb-12">
                    <div className="w-full h-full neon-border bg-black/30 rounded-xl p-4 flex items-center justify-center">
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
                            <div className="text-white animate-pulse">CONNECTING TO STAGE...</div>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex gap-6">
                    <button
                        onClick={onEndGame}
                        className="px-8 py-4 bg-transparent border-2 border-red-500 text-red-500 font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all duration-300 rounded shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                    >
                        End Show
                    </button>

                    {/* Mic Indicator (Passive) */}
                    <div className={`px-8 py-4 border-2 font-bold uppercase tracking-widest transition-all duration-300 rounded flex items-center gap-2 border-[var(--neon-secondary)] text-[var(--neon-secondary)] shadow-[0_0_15px_rgba(0,224,255,0.5)] animate-pulse`}>
                        <span className="w-3 h-3 rounded-full bg-current"></span>
                        MIC LIVE
                    </div>
                </div>

            </main>

            {/* Footer */}
            <footer className="z-20 p-2 text-center text-gray-600 text-xs font-mono">
                POWERED BY LIVEKIT AGENTS • DAY 10 CHALLENGE
            </footer>
        </div>
    );
}
