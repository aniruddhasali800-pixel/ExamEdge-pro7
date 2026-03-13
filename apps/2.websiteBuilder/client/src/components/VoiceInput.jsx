import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const VoiceInput = ({ onSpeechResult }) => {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Speech recognition is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            if (onSpeechResult) {
                onSpeechResult(transcript);
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            if (event.error === 'not-allowed') {
                setError("Microphone access denied.");
            } else {
                setError("Speech recognition error: " + event.error);
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
    }, [onSpeechResult]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setError(null);
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                console.error("Failed to start recognition:", err);
            }
        }
    };

    if (error && error.includes("not supported")) {
        return null; // Don't show anything if browser doesn't support it
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleListening}
                className={`p-3 rounded-full transition-all duration-300 relative ${isListening
                        ? "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                title={isListening ? "Stop Listening" : "Talk to describes your website"}
            >
                <AnimatePresence mode="wait">
                    {isListening ? (
                        <motion.div
                            key="mic-on"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                        >
                            <Mic size={20} className="text-white" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="mic-off"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                        >
                            <Mic size={20} className="text-zinc-400" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {isListening && (
                    <motion.div
                        className="absolute inset-0 rounded-full border-2 border-red-400"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                )}
            </motion.button>

            {error && <p className="text-[10px] text-red-400 font-medium absolute top-full mt-1 w-max">{error}</p>}

            {isListening && (
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] text-zinc-400 font-medium"
                >
                    Listening...
                </motion.span>
            )}
        </div>
    );
};

export default VoiceInput;
