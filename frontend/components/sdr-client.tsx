"use client";

import { useEffect, useState } from "react";
import { Room, RoomEvent, createLocalAudioTrack, DataPacket_Kind, RemoteParticipant, Track } from "livekit-client";

export default function SdrClient() {
    const [status, setStatus] = useState("Idle");
    const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
    const [room, setRoom] = useState<Room | null>(null);
    const [isCallActive, setIsCallActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startCall = async () => {
        setError(null);
        setStatus("Connecting...");

        try {
            const response = await fetch("/api/token?room=sdr-agent");
            if (!response.ok) {
                throw new Error("Failed to fetch token");
            }
            const data = await response.json();
            const token = data.accessToken;

            const newRoom = new Room({
                adaptiveStream: true,
                dynacast: true,
            });

            setRoom(newRoom);

            newRoom.on(RoomEvent.Connected, () => {
                setStatus("Listening");
                setIsCallActive(true);
            });

            newRoom.on(RoomEvent.Disconnected, () => {
                setStatus("Idle");
                setIsCallActive(false);
                setRoom(null);
            });

            newRoom.on(RoomEvent.DataReceived, (payload: Uint8Array, participant: RemoteParticipant | undefined, _kind: DataPacket_Kind | undefined, _topic?: string) => {
                const str = new TextDecoder().decode(payload);
                try {
                    const msg = JSON.parse(str);
                    if (msg.type === "transcription") {
                        setMessages((prev) => [...prev, { sender: "User", text: msg.text }]);
                    } else if (msg.type === "agent_response") {
                        setMessages((prev) => [...prev, { sender: "Agent", text: msg.text }]);
                    }
                } catch (e) {
                    // Ignore non-JSON
                }
            });

            newRoom.on(RoomEvent.TranscriptionReceived, (transcriptionSegments, participant, publication) => {
                transcriptionSegments.forEach((segment) => {
                    if (!segment.final) return;
                    const sender = participant === newRoom.localParticipant ? "You" : "Agent";
                    setMessages((prev) => [...prev, { sender, text: segment.text }]);
                });
            });

            await newRoom.connect(data.url, token);

            const audioTrack = await createLocalAudioTrack({
                echoCancellation: true,
                noiseSuppression: true,
            });
            await newRoom.localParticipant.publishTrack(audioTrack);

            newRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
                if (track.kind === Track.Kind.Audio) {
                    track.attach();
                }
            });

        } catch (err: any) {
            console.error("Error starting call:", err);
            setError(err.message || "Failed to connect");
            setStatus("Error");
            setIsCallActive(false);
        }
    };

    const stopCall = async () => {
        if (room) {
            await room.disconnect();
        }
    };

    useEffect(() => {
        return () => {
            if (room) {
                room.disconnect();
            }
        };
    }, [room]);

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen font-serif text-[#4A3B32] overflow-hidden">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=2574&auto=format&fit=crop")',
                }}
            >
                <div className="absolute inset-0 bg-[#2C241F]/80 backdrop-blur-sm"></div>
            </div>

            <div className="relative z-10 w-full max-w-lg bg-[#FDFBF7] rounded-xl shadow-2xl overflow-hidden border border-[#E6DCCF]">

                {/* Header */}
                <div className="bg-[#4A3B32] p-8 text-center border-b-4 border-[#C6A88F]">
                    <h1 className="text-3xl font-bold text-[#FDFBF7] mb-3 tracking-wide">Blue Tokai SDR</h1>
                    <p className="text-[#E6DCCF] text-sm font-light italic">
                        "Your personal coffee concierge"
                    </p>
                </div>

                {/* Status & Controls */}
                <div className="p-8 flex flex-col items-center space-y-8">

                    <div className={`px-6 py-2 rounded-full text-sm font-medium tracking-wider uppercase border ${status === "Listening" ? "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9] animate-pulse" :
                        status === "Connecting..." ? "bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]" :
                            status === "Error" ? "bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]" :
                                "bg-[#F5F5F5] text-[#757575] border-[#E0E0E0]"
                        }`}>
                        {status}
                    </div>

                    {error && (
                        <div className="text-[#C62828] text-sm text-center px-4 bg-[#FFEBEE] py-2 rounded border border-[#FFCDD2]">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-center w-full">
                        {!isCallActive ? (
                            <button
                                onClick={startCall}
                                className="group relative px-10 py-4 bg-[#8D6E63] hover:bg-[#795548] text-white font-bold rounded-full shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#D7CCC8]"
                            >
                                <span className="flex items-center gap-2">
                                    <span>Start Conversation</span>
                                </span>
                            </button>
                        ) : (
                            <button
                                onClick={stopCall}
                                className="px-10 py-4 bg-[#A1887F] hover:bg-[#8D6E63] text-white font-bold rounded-full shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-[#D7CCC8]"
                            >
                                End Conversation
                            </button>
                        )}
                    </div>
                </div>

                {/* Transcripts */}
                <div className="bg-[#FFF8E1]/30 p-6 h-80 overflow-y-auto border-t border-[#E6DCCF]">
                    <h3 className="text-xs font-bold text-[#8D6E63] uppercase tracking-widest mb-4 text-center">Transcript</h3>
                    <div className="space-y-4">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-[#A1887F] italic opacity-60">
                                <p>Ready to take your order...</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div key={idx} className={`flex flex-col ${msg.sender === "You" ? "items-end" : "items-start"}`}>
                                    <span className="text-[10px] uppercase tracking-wider text-[#A1887F] mb-1 ml-1 mr-1">{msg.sender}</span>
                                    <div className={`px-5 py-3 rounded-2xl text-sm max-w-[85%] leading-relaxed shadow-sm ${msg.sender === "You"
                                        ? "bg-[#D7CCC8] text-[#3E2723] rounded-tr-none"
                                        : "bg-white border border-[#E6DCCF] text-[#5D4037] rounded-tl-none"
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* Footer/Branding */}
            <div className="absolute bottom-4 text-[#FDFBF7]/60 text-xs font-light tracking-widest">
                POWERED BY BLUE TOKAI & LIVEKIT
            </div>
        </div>
    );
}
