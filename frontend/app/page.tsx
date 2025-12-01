'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChatText, Lightning, Microphone } from '@phosphor-icons/react';

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

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {!showLogin ? (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-20 flex max-w-4xl flex-col items-center px-4 text-center"
          >
            {/* Title */}
            <h1 className="mb-2 text-6xl font-black tracking-tighter md:text-8xl">
              <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">
                IMPROV
              </span>
              <br />
              <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">
                BATTLE
              </span>
            </h1>
            <h2 className="mb-6 text-3xl font-bold tracking-[0.2em] text-pink-500 drop-shadow-[0_0_10px_rgba(255,0,255,0.5)] md:text-4xl">
              ARENA
            </h2>

            <p className="mb-12 max-w-2xl text-lg text-gray-400">
              Step into the future of voice-powered interactions. Battle your way through
              conversations with advanced AI agents in real-time.
            </p>

            {/* Feature Cards */}
            <div className="mb-12 grid w-full grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { icon: Microphone, title: 'Voice First', desc: 'Natural voice interaction' },
                { icon: Lightning, title: 'Real-time', desc: 'Instant AI responses' },
                { icon: ChatText, title: 'Transcripts', desc: 'Full conversation logs' },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="group rounded-2xl border border-gray-800 bg-black/40 p-6 backdrop-blur-sm transition-colors hover:border-cyan-500/50"
                >
                  <feature.icon
                    size={32}
                    className="mx-auto mb-4 text-cyan-400 transition-transform group-hover:scale-110"
                  />
                  <h3 className="mb-2 text-xl font-bold text-white">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowLogin(true)}
              className="transform rounded-lg bg-cyan-400 px-12 py-4 text-xl font-black text-black shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all hover:scale-105 hover:bg-cyan-300 hover:shadow-[0_0_30px_rgba(0,255,255,0.6)]"
            >
              START GAME
            </button>

            <div className="mt-12 text-[10px] tracking-widest text-gray-600 uppercase">
              Powered by LiveKit Voice Agents • Built for Day 10 Challenge
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-20 flex w-full max-w-md flex-col items-center px-4"
          >
            <h1 className="mb-1 text-center text-4xl font-black tracking-tighter md:text-5xl">
              <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
                IMPROV BATTLE
              </span>
            </h1>
            <h2 className="mb-12 text-xl font-bold tracking-[0.2em] text-pink-500 drop-shadow-[0_0_5px_rgba(255,0,255,0.5)]">
              ARENA
            </h2>

            <div className="w-full rounded-2xl border border-gray-800 bg-black/60 p-8 shadow-2xl backdrop-blur-md">
              <label className="mb-2 block text-center text-xs font-bold tracking-wider text-gray-400 uppercase">
                Enter Your Call Sign
              </label>

              <div className="relative mb-8">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                  placeholder="AGENT_NAME"
                  className="w-full rounded-lg border border-cyan-500/50 bg-gray-900/50 px-4 py-3 text-center font-mono text-white placeholder-gray-600 transition-all focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
                  autoFocus
                />
              </div>

              <button
                onClick={handleStart}
                disabled={!playerName.trim()}
                className="w-full rounded-lg border border-cyan-700 bg-cyan-900/50 py-3 font-bold tracking-wider text-cyan-400 uppercase transition-all hover:bg-cyan-800/50 hover:shadow-[0_0_15px_rgba(0,255,255,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Enter Arena
              </button>
            </div>

            <div className="mt-8 text-[10px] tracking-widest text-gray-600 uppercase">
              Powered by LiveKit Agents
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
