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
        <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--neon-bg)] p-4 relative overflow-hidden">
            {/* Scanline Overlay */}
            <div className="absolute inset-0 scanlines z-10 opacity-20 pointer-events-none"></div>

            <div className="z-20 w-full max-w-md">
                <div className="neon-border bg-black/80 p-8 rounded-lg text-center backdrop-blur-sm transform transition-all hover:scale-[1.02]">
                    <h1 className="text-4xl font-bold mb-8 text-white neon-text tracking-wider uppercase italic">
                        Improv Battle
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative group">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="ENTER PLAYER NAME"
                                className="w-full bg-transparent border-b-2 border-[var(--neon-secondary)] text-[var(--neon-secondary)] text-xl py-2 px-4 focus:outline-none focus:border-[var(--neon-primary)] transition-colors placeholder-gray-600 font-mono text-center uppercase"
                                autoFocus
                            />
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--neon-primary)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                        </div>

                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="w-full py-4 px-6 bg-transparent border-2 border-[var(--neon-primary)] text-[var(--neon-primary)] font-bold text-xl uppercase tracking-widest hover:bg-[var(--neon-primary)] hover:text-white transition-all duration-300 neon-text disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                        >
                            Start Battle
                        </button>
                    </form>

                    <div className="mt-8 text-xs text-gray-500 font-mono">
                        INSERT COIN TO PLAY
                    </div>
                </div>
            </div>
        </div>
    );
}
