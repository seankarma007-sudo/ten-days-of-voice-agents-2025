'use client';

import { useChatMessages } from '@/hooks/useChatMessages';
import { useEffect, useRef } from 'react';

export function Transcript() {
    const messages = useChatMessages();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="flex flex-col h-full p-4 border rounded-lg bg-white/5 backdrop-blur-sm overflow-hidden">
            <h2 className="text-xl font-bold mb-4 text-white">Transcript</h2>
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-2 pr-2"
            >
                {messages.map((msg) => (
                    <div key={msg.id} className="mb-2">
                        <span className={`font-bold ${msg.from?.isLocal ? 'text-blue-400' : 'text-green-400'}`}>
                            {msg.from?.isLocal ? 'User' : 'Agent'}:
                        </span>
                        <span className="ml-2 text-gray-200">{msg.message}</span>
                    </div>
                ))}
                {messages.length === 0 && (
                    <p className="text-gray-500 italic">No messages yet...</p>
                )}
            </div>
        </div>
    );
}
