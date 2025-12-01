'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Microphone, Lightning, ChatText, ArrowRight } from '@phosphor-icons/react';

export default function Home() {
    const [showLogin, setShowLogin] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const router = useRouter();

    const handleStart = () => {
        if (playerName.trim()) {
            router.push(`/session?name=${encodeURIComponent(playerName)}`);
        }
    };

    return (
        <main className="relative h-screen w-full overflow-hidden bg-black text-white flex flex-col items-center justify-center font-sans">
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

            {/* Main Content */}
            <AnimatePresence mode="wait">
                {!showLogin ? (
                    <motion.div
                        key="home"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="relative z-20 flex flex-col items-center max-w-4xl px-4 text-center"
                    >
                        {/* Title */}
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-2">
                            <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">IMPROV</span>
                            <br />
                            <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">BATTLE</span>
                        </h1>
                        <h2 className="text-3xl md:text-4xl font-bold text-pink-500 tracking-[0.2em] mb-6 drop-shadow-[0_0_10px_rgba(255,0,255,0.5)]">
                            ARENA
                        </h2>

                        <p className="text-gray-400 max-w-2xl mb-12 text-lg">
                            Step into the future of voice-powered interactions. Battle your way through conversations with advanced AI agents in real-time.
                        </p>

                        {/* Feature Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
                            {[
                                { icon: Microphone, title: "Voice First", desc: "Natural voice interaction" },
                                { icon: Lightning, title: "Real-time", desc: "Instant AI responses" },
                                { icon: ChatText, title: "Transcripts", desc: "Full conversation logs" }
                            ].map((feature, idx) => (
                                <div key={idx} className="bg-black/40 border border-gray-800 p-6 rounded-2xl backdrop-blur-sm hover:border-cyan-500/50 transition-colors group">
                                    <feature.icon size={32} className="text-cyan-400 mb-4 mx-auto group-hover:scale-110 transition-transform" />
                                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                                    <p className="text-gray-500 text-sm">{feature.desc}</p>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowLogin(true)}
                            className="bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xl py-4 px-12 rounded-lg shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:shadow-[0_0_30px_rgba(0,255,255,0.6)] transition-all transform hover:scale-105"
                        >
                            START GAME
                        </button>

                        <div className="mt-12 text-[10px] text-gray-600 uppercase tracking-widest">
                            Powered by LiveKit Voice Agents • Built for Day 10 Challenge
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="login"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative z-20 flex flex-col items-center w-full max-w-md px-4"
                    >
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-1 text-center">
                            <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">IMPROV BATTLE</span>
                        </h1>
                        <h2 className="text-xl font-bold text-pink-500 tracking-[0.2em] mb-12 drop-shadow-[0_0_5px_rgba(255,0,255,0.5)]">
                            ARENA
                        </h2>

                        <div className="w-full bg-black/60 border border-gray-800 p-8 rounded-2xl backdrop-blur-md shadow-2xl">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">
                                Enter Your Call Sign
                            </label>

                            <div className="relative mb-8">
                                <input
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                                    placeholder="AGENT_NAME"
                                    className="w-full bg-gray-900/50 border border-cyan-500/50 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-center font-mono"
                                    autoFocus
                                />
                            </div>

                            <button
                                onClick={handleStart}
                                disabled={!playerName.trim()}
                                className="w-full bg-cyan-900/50 hover:bg-cyan-800/50 border border-cyan-700 text-cyan-400 font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider hover:shadow-[0_0_15px_rgba(0,255,255,0.2)]"
                            >
                                Enter Arena
                            </button>
                        </div>

                        <div className="mt-8 text-[10px] text-gray-600 uppercase tracking-widest">
                            Powered by LiveKit Agents
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
