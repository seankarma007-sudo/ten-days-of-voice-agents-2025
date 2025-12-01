'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { GameScreen } from '@/components/GameScreen';
// import { motion } from 'framer-motion';
import { motion, AnimatePresence } from 'motion/react';

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
            const response = await fetch(`/api/token?room=improv-${Math.random().toString(36).substring(7)}&username=${encodeURIComponent(playerName)}`);
            const data = await response.json();
            setToken(data.accessToken);
            setUrl(data.url);
            setHasConnected(true);
        } catch (e) {
            console.error("Failed to join:", e);
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

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-20 flex flex-col items-center w-full max-w-md px-4"
            >
                <div className="w-full bg-black/60 border border-pink-500/30 p-8 rounded-2xl backdrop-blur-md shadow-[0_0_30px_rgba(255,0,255,0.1)] text-center">
                    <h2 className="text-3xl font-bold text-cyan-400 mb-2 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
                        Welcome, {playerName}
                    </h2>
                    <p className="text-gray-400 text-sm mb-8">
                        Ready to enter the battle arena?
                    </p>

                    <button
                        onClick={handleConnect}
                        disabled={isConnecting}
                        className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-black py-4 rounded-lg shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:shadow-[0_0_30px_rgba(0,255,255,0.6)] transition-all uppercase tracking-wider mb-6 disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isConnecting ? 'INITIALIZING...' : 'CONNECT TO AGENT'}
                    </button>

                    <button
                        onClick={() => router.push('/')}
                        className="text-gray-500 text-xs hover:text-gray-300 transition-colors"
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
        <Suspense fallback={<div className="h-screen w-full bg-black text-cyan-500 flex items-center justify-center font-mono">LOADING SYSTEM...</div>}>
            <SessionContent />
        </Suspense>
    );
}
