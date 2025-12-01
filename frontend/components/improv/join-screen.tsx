import React, { useState } from 'react';

interface JoinScreenProps {
  onJoin: (name: string) => void;
}

export function JoinScreen({ onJoin }: JoinScreenProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name.trim());
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--neon-bg)] p-4">
      {/* Scanline Overlay */}
      <div className="scanlines pointer-events-none absolute inset-0 z-10 opacity-20"></div>

      <div className="z-20 w-full max-w-md">
        <div className="neon-border transform rounded-lg bg-black/80 p-8 text-center backdrop-blur-sm transition-all hover:scale-[1.02]">
          <h1 className="neon-text mb-8 text-4xl font-bold tracking-wider text-white uppercase italic">
            Improv Battle
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="group relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ENTER PLAYER NAME"
                className="w-full border-b-2 border-[var(--neon-secondary)] bg-transparent px-4 py-2 text-center font-mono text-xl text-[var(--neon-secondary)] uppercase placeholder-gray-600 transition-colors focus:border-[var(--neon-primary)] focus:outline-none"
                autoFocus
              />
              <div className="absolute bottom-0 left-0 h-0.5 w-full scale-x-0 transform bg-[var(--neon-primary)] transition-transform duration-300 group-hover:scale-x-100"></div>
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="neon-text w-full transform border-2 border-[var(--neon-primary)] bg-transparent px-6 py-4 text-xl font-bold tracking-widest text-[var(--neon-primary)] uppercase transition-all duration-300 hover:bg-[var(--neon-primary)] hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start Battle
            </button>
          </form>

          <div className="mt-8 font-mono text-xs text-gray-500">INSERT COIN TO PLAY</div>
        </div>
      </div>
    </div>
  );
}
