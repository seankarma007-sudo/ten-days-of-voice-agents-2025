'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { AppConfig } from '@/app-config';
import { ChatTranscript } from '@/components/app/chat-transcript';
import { PreConnectMessage } from '@/components/app/preconnect-message';
import { TileLayout } from '@/components/app/tile-layout';
import {
  AgentControlBar,
  type ControlBarControls,
} from '@/components/livekit/agent-control-bar/agent-control-bar';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useConnectionTimeout } from '@/hooks/useConnectionTimout';
import { useDebugMode } from '@/hooks/useDebug';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../livekit/scroll-area/scroll-area';

const MotionBottom = motion.create('div');

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';

// Inline Components for Horror Theme
const PlayerStatusPanel = () => (
  <div className="border border-primary/20 bg-card/50 p-4 rounded-lg h-full overflow-y-auto shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
    <h3 className="text-primary font-mono text-lg mb-4 border-b border-primary/20 pb-2 tracking-widest text-glow">STATUS</h3>
    <div className="space-y-6 text-sm font-mono text-muted-foreground">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span>HEALTH</span>
          <span className="text-red-500 animate-pulse">CRITICAL</span>
        </div>
        <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-primary/20">
          <div className="h-full bg-red-900 w-[20%] animate-pulse" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span>SANITY</span>
          <span className="text-yellow-600">FRAYED</span>
        </div>
        <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-primary/20">
          <div className="h-full bg-yellow-900 w-[45%]" />
        </div>
      </div>

      <div className="mt-8">
        <p className="text-xs uppercase mb-3 text-primary/70">Inventory</p>
        <ul className="space-y-2 text-xs">
          <li className="flex items-center gap-2">
            <span className="size-1.5 bg-primary rounded-full" />
            Rusty Key
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1.5 bg-primary rounded-full" />
            Flashlight (Low Battery)
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1.5 bg-primary rounded-full" />
            Strange Note
          </li>
        </ul>
      </div>
    </div>
  </div>
);

const PuzzlePanel = () => (
  <div className="border border-primary/20 bg-card/50 p-4 rounded-lg h-full overflow-y-auto shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
    <h3 className="text-primary font-mono text-lg mb-4 border-b border-primary/20 pb-2 tracking-widest text-glow">ARCHIVES</h3>
    <div className="text-xs font-mono text-muted-foreground space-y-4">
      <p className="italic text-primary/60">"The combination lies within the shadows of the past..."</p>

      <div className="p-3 border border-primary/10 bg-black/40 rounded hover:border-primary/30 transition-colors cursor-help">
        <p className="font-bold text-primary/80 mb-1">Clue #1</p>
        <p>The clock stopped at 3:15...</p>
      </div>

      <div className="p-3 border border-primary/10 bg-black/40 rounded hover:border-primary/30 transition-colors cursor-help">
        <p className="font-bold text-primary/80 mb-1">Clue #2</p>
        <p>She always loved red roses.</p>
      </div>

      <div className="p-3 border border-primary/10 bg-black/40 rounded hover:border-primary/30 transition-colors cursor-help opacity-50">
        <p className="font-bold text-primary/80 mb-1">???</p>
        <p>Locked</p>
      </div>
    </div>
  </div>
);

interface SessionViewProps {
  appConfig: AppConfig;
}

export const SessionView = ({
  appConfig,
  ...props
}: React.ComponentProps<'section'> & SessionViewProps) => {
  useConnectionTimeout(200_000);
  useDebugMode({ enabled: IN_DEVELOPMENT });

  const messages = useChatMessages();
  const [chatOpen, setChatOpen] = useState(true); // Default to open for transcript visibility
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const controls: ControlBarControls = {
    leave: true,
    microphone: true,
    chat: appConfig.supportsChatInput,
    camera: appConfig.supportsVideoInput,
    screenShare: appConfig.supportsVideoInput,
  };

  useEffect(() => {
    const lastMessage = messages.at(-1);
    const lastMessageIsLocal = lastMessage?.from?.isLocal === true;

    if (scrollAreaRef.current && lastMessageIsLocal) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleRestart = () => {
    if (confirm("Are you sure you want to restart the nightmare? All progress will be lost.")) {
      window.location.reload();
    }
  };

  return (
    <section className="bg-background relative z-10 h-full w-full overflow-hidden flex flex-col p-2 md:p-4 gap-4" {...props}>
      {/* Top Bar */}
      <div className="flex justify-between items-center px-2">
        <h2 className="text-primary font-mono text-xl tracking-[0.2em] uppercase text-glow animate-pulse">
          Cursed Realm
        </h2>
        <button
          onClick={handleRestart}
          className="px-4 py-1 border border-destructive text-destructive hover:bg-destructive/10 font-mono text-sm transition-colors uppercase tracking-wider"
        >
          Restart Story
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 min-h-0">
        {/* Left Panel - Player Status */}
        <div className="hidden md:block md:col-span-1">
          <PlayerStatusPanel />
        </div>

        {/* Center Panel - Game Master / Transcript */}
        <div className="col-span-1 md:col-span-2 relative border border-primary/10 bg-black/20 rounded-lg overflow-hidden flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          {/* GM Message Area / Transcript */}
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 pointer-events-none z-10" />

            {/* Visualizer / Tiles */}
            <TileLayout chatOpen={chatOpen} className="absolute inset-x-0 top-0 h-[120px] z-20" />

            <ScrollArea ref={scrollAreaRef} className="h-full px-4 py-4 pt-[130px]">
              <ChatTranscript
                hidden={false}
                messages={messages}
                className="mx-auto max-w-2xl space-y-4"
              />
            </ScrollArea>
          </div>

          {/* Controls */}
          <div className="p-4 bg-black/40 border-t border-primary/10 backdrop-blur-sm">
            <div className="max-w-md mx-auto">
              <AgentControlBar controls={controls} onChatOpenChange={setChatOpen} />
            </div>
          </div>
        </div>

        {/* Right Panel - Puzzles/Archives */}
        <div className="hidden md:block md:col-span-1">
          <PuzzlePanel />
        </div>
      </div>
    </section>
  );
};
