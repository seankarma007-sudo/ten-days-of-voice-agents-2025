'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { AppConfig } from '@/app-config';
import { Transcript } from '@/components/transcript';
import { LastOrder } from '@/components/last-order';
import {
  AgentControlBar,
  type ControlBarControls,
} from '@/components/livekit/agent-control-bar/agent-control-bar';
import { useConnectionTimeout } from '@/hooks/useConnectionTimout';
import { useDebugMode } from '@/hooks/useDebug';
import { cn } from '@/lib/utils';

const MotionBottom = motion.create('div');

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';
const BOTTOM_VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
      translateY: '0%',
    },
    hidden: {
      opacity: 0,
      translateY: '100%',
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.3,
    delay: 0.5,
    ease: 'easeOut',
  },
};

interface SessionViewProps {
  appConfig: AppConfig;
}

export const SessionView = ({
  appConfig,
  ...props
}: React.ComponentProps<'section'> & SessionViewProps) => {
  useConnectionTimeout(200_000);
  useDebugMode({ enabled: IN_DEVELOPMENT });

  const [chatOpen, setChatOpen] = useState(false);

  const controls: ControlBarControls = {
    leave: true,
    microphone: true,
    chat: false, // Hide chat toggle since we show transcript always
    camera: false,
    screenShare: false,
  };

  return (
    <section className="bg-background relative z-10 h-full w-full overflow-hidden flex flex-col" {...props}>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-4 p-4 pb-24 h-full">
        {/* Transcript Panel */}
        <div className="w-2/3 h-full">
          <Transcript />
        </div>

        {/* Last Order Panel */}
        <div className="w-1/3 h-full">
          <LastOrder />
        </div>
      </div>

      {/* Bottom Control Bar */}
      <MotionBottom
        {...BOTTOM_VIEW_MOTION_PROPS}
        className="fixed inset-x-3 bottom-0 z-50 md:inset-x-12"
      >
        <div className="bg-background relative mx-auto max-w-2xl pb-3 md:pb-12">
          <AgentControlBar controls={controls} onChatOpenChange={setChatOpen} />
        </div>
      </MotionBottom>
    </section>
  );
};
