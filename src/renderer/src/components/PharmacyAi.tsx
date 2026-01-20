
import React, { useState, useRef } from 'react';
// import { connectToPharmacyLive } from '../services/geminiService';

const PharmacyAI: React.FC = () => {
    const [isActive, setIsActive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    //   const [transcript, setTranscript] = useState('');

    const audioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef(0);
    const sessionRef = useRef<any>(null);

    const toggleAssistant = async () => {
        if (isActive) {
            setIsActive(false);
            return;
        }

        setIsConnecting(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            const inputContext = new AudioContext({ sampleRate: 16000 });
            const outputNode = audioContextRef.current.createGain();
            outputNode.connect(audioContextRef.current.destination);

            // const sessionPromise = connectToPharmacyLive({
            //     onopen: () => {
            //         setIsConnecting(false);
            //         setIsActive(true);

            //         const source = inputContext.createMediaStreamSource(stream);
            //         const processor = inputContext.createScriptProcessor(4096, 1, 1);

            //         processor.onaudioprocess = (e) => {
            //             const inputData = e.inputBuffer.getChannelData(0);
            //             const int16 = new Int16Array(inputData.length);
            //             for (let i = 0; i < inputData.length; i++) {
            //                 int16[i] = inputData[i] * 32768;
            //             }
            //             const base64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)));
            //             sessionPromise.then(s => s.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } }));
            //         };

            //         source.connect(processor);
            //         processor.connect(inputContext.destination);
            //     },
            //     onmessage: async (msg: any) => {
            //         const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            //         if (base64Audio && audioContextRef.current) {
            //             const binary = atob(base64Audio);
            //             const bytes = new Uint8Array(binary.length);
            //             for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

            //             const dataInt16 = new Int16Array(bytes.buffer);
            //             const buffer = audioContextRef.current.createBuffer(1, dataInt16.length, 24000);
            //             const channelData = buffer.getChannelData(0);
            //             for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

            //             const source = audioContextRef.current.createBufferSource();
            //             source.buffer = buffer;
            //             source.connect(outputNode);

            //             nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
            //             source.start(nextStartTimeRef.current);
            //             nextStartTimeRef.current += buffer.duration;
            //         }
            //     },
            //     onerror: (e: any) => console.error("Live AI Error:", e),
            //     onclose: () => setIsActive(false),
            // });

            // sessionRef.current = await sessionPromise;
        } catch (err) {
            console.error(err);
            setIsConnecting(false);
        }
    };

    return (
        <div className="fixed bottom-10 right-10 z-[100]">
            <button
                onClick={toggleAssistant}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-110 active:scale-90 relative ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-900'
                    }`}
            >
                {isConnecting ? (
                    <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : isActive ? (
                    <svg width="32" height="32" fill="white" viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="8" y1="22" x2="16" y2="22" /></svg>
                ) : (
                    <div className="relative">
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-sky-500 rounded-full animate-ping"></div>
                        <svg width="32" height="32" fill="white" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                    </div>
                )}

                {isActive && (
                    <div className="absolute -top-16 right-0 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 whitespace-nowrap animate-in slide-in-from-bottom-4">
                        <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Maria Live Active</p>
                        <p className="text-[9px] text-slate-400 font-bold">"Je vous écoute..."</p>
                    </div>
                )}
            </button>
        </div>
    );
};

export default PharmacyAI;
