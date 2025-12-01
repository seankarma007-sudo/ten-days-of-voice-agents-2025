'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarVisualizer, useLocalParticipant, useVoiceAssistant } from '@livekit/components-react';
import {
  Broadcast,
  Microphone,
  MicrophoneSlash,
  SpeakerHigh,
  UserCircle,
  XCircle,
} from '@phosphor-icons/react';

interface GameScreenProps {
  playerName: string;
}

export function GameScreen({ playerName }: GameScreenProps) {
  const router = useRouter();
  const { state, audioTrack } = useVoiceAssistant();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();

  const handleEndGame = () => {
    router.push('/');
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-black text-white">
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
      <header className="relative z-20 flex items-center justify-between border-b border-cyan-900/50 bg-black/40 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2">
            <Broadcast size={24} className="animate-pulse text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              IMPROV<span className="text-cyan-400">.AI</span>
            </h2>
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-cyan-500/80 uppercase">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              Live Connection
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded-full border border-gray-800 bg-gray-900/50 px-4 py-2 md:flex">
            <UserCircle size={20} className="text-pink-500" />
            <span className="text-sm font-medium text-gray-300">{playerName}</span>
          </div>
          <button
            onClick={handleEndGame}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-500"
            title="Disconnect"
          >
            <XCircle size={28} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-20 flex flex-1 flex-col items-center justify-center p-6">
        {/* Visualizer Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative aspect-video max-h-[60vh] w-full max-w-4xl"
        >
          {/* Decorative Frame */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl border border-cyan-500/30 bg-black/40 backdrop-blur-sm">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-50" />

            {/* Center Visualizer */}
            <div className="absolute inset-0 flex items-center justify-center">
              {state !== 'disconnected' && state !== 'connecting' && audioTrack ? (
                <div className="flex h-1/2 w-full items-center justify-center px-12">
                  <BarVisualizer
                    state={state}
                    trackRef={audioTrack}
                    barCount={40}
                    options={{ minHeight: 5 }}
                    className="h-full w-full"
                    style={{ height: '100%' }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-cyan-500/50">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-500" />
                  <p className="font-mono text-sm tracking-widest uppercase">
                    Establishing Uplink...
                  </p>
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
          <p className="text-lg font-medium text-white md:text-xl">
            {state !== 'disconnected' && state !== 'connecting' ? (
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
      <footer className="relative z-20 flex justify-center p-6">
        <div className="flex items-center gap-6 rounded-full border border-gray-800 bg-gray-900/80 px-8 py-4 shadow-2xl backdrop-blur-md">
          <button
            onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
            className={`rounded-full p-3 transition-colors ${
              isMicrophoneEnabled
                ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            }`}
            title={isMicrophoneEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {isMicrophoneEnabled ? (
              <Microphone size={24} weight="fill" />
            ) : (
              <MicrophoneSlash size={24} weight="fill" />
            )}
          </button>
          <div className="h-8 w-[1px] bg-gray-700" />
          <div
            className={`rounded-full p-3 ${state !== 'disconnected' && state !== 'connecting' ? 'bg-pink-500/20 text-pink-400' : 'bg-gray-800 text-gray-600'}`}
          >
            <SpeakerHigh size={24} weight="fill" />
          </div>
        </div>
      </footer>
    </div>
  );
}
