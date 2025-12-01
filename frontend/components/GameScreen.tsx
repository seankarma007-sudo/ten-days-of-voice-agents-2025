'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVoiceAssistant, BarVisualizer, useLiveKitRoom } from '@livekit/components-react';
import { motion } from 'framer-motion';
import { Microphone, SpeakerHigh, XCircle, UserCircle, Broadcast } from '@phosphor-icons/react';

interface GameScreenProps {
    playerName: string;
}

export function GameScreen({ playerName }: GameScreenProps) {
    const router = useRouter();
    const { state, audioTrack } = useVoiceAssistant();
    const room = useLiveKitRoom();

    const handleEndGame = () => {
        router.push('/');
    };

    return (
        <div className="relative h-screen w-full overflow-hidden bg-black text-white flex flex-col">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 opacity-60"
                style={{
                    backgroundImage: 'url(/bg-arena.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />

            {/* Scanline Overlay */}
            <div className="scanline z-10" />

            {/* Header */}
            <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-cyan-900/50 bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                        <Broadcast size={24} className="text-cyan-400 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-white">IMPROV<span className="text-cyan-400">.AI</span></h2>
                        <div className="flex items-center gap-2 text-[10px] text-cyan-500/80 font-mono uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Live Connection
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-900/50 rounded-full border border-gray-800">
                        <UserCircle size={20} className="text-pink-500" />
                        <span className="text-sm font-medium text-gray-300">{playerName}</span>
                    </div>
                    <button
                        onClick={handleEndGame}
                        className="p-2 hover:bg-red-500/20 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                        title="Disconnect"
                    >
                        <XCircle size={28} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-20 flex-1 flex flex-col items-center justify-center p-6">

                {/* Visualizer Container */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-4xl aspect-video max-h-[60vh] relative"
                >
                    {/* Decorative Frame */}
                    <div className="absolute inset-0 border border-cyan-500/30 rounded-2xl bg-black/40 backdrop-blur-sm overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-50" />

                        {/* Center Visualizer */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            {state === 'connected' && audioTrack ? (
                                <div className="w-full h-1/2 px-12 flex items-center justify-center">
                                    <BarVisualizer
                                        state={state}
                                        trackRef={audioTrack}
                                        barCount={40}
                                        options={{ color: '#00ffff', thickness: 6 }}
                                        className="w-full h-full"
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4 text-cyan-500/50">
                                    <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                                    <p className="font-mono text-sm tracking-widest uppercase">Establishing Uplink...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Status Text */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 text-center"
                >
                    <p className="text-lg md:text-xl text-white font-medium">
                        {state === 'connected' ? (
                            <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
                                Agent is listening...
                            </span>
                        ) : (
                            <span className="text-gray-500">Connecting to neural network...</span>
                        )}
                    </p>
                </motion.div>

            </main>

            {/* Footer Controls */}
            <footer className="relative z-20 p-6 flex justify-center">
                <div className="flex items-center gap-6 px-8 py-4 bg-gray-900/80 backdrop-blur-md rounded-full border border-gray-800 shadow-2xl">
                    <div className={`p-3 rounded-full ${state === 'connected' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800 text-gray-600'}`}>
                        <Microphone size={24} weight="fill" />
                    </div>
                    <div className="h-8 w-[1px] bg-gray-700" />
                    <div className={`p-3 rounded-full ${state === 'connected' ? 'bg-pink-500/20 text-pink-400' : 'bg-gray-800 text-gray-600'}`}>
                        <SpeakerHigh size={24} weight="fill" />
                    </div>
                </div>
            </footer>

        </div>
    );
}
