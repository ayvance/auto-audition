"use client";

import { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";

export default function QuestionReader({ text, settings }) {
    const [speaking, setSpeaking] = useState(false);
    const [supported, setSupported] = useState(false);

    // Ensure settings is an object
    const safeSettings = settings || {};

    useEffect(() => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            setSupported(true);
        }
    }, []);

    useEffect(() => {
        // Stop speaking when text changes (new question)
        if (supported) {
            window.speechSynthesis.cancel();
            setSpeaking(false);
            // Optional: Auto-play
            // speak(); 
        }
        return () => {
            if (supported) {
                window.speechSynthesis.cancel();
            }
        };
    }, [text, supported]);

    function speak() {
        if (!supported) return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply settings
        utterance.rate = safeSettings.rate || 1;
        utterance.pitch = safeSettings.pitch || 1;
        utterance.volume = safeSettings.volume !== undefined ? safeSettings.volume : 1;
        
        if (safeSettings.voiceURI) {
            const voices = window.speechSynthesis.getVoices();
            const selectedVoice = voices.find(v => v.voiceURI === safeSettings.voiceURI);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        }

        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);

        setSpeaking(true);
        window.speechSynthesis.speak(utterance);
    }

    function stop() {
        if (!supported) return;
        window.speechSynthesis.cancel();
        setSpeaking(false);
    }

    if (!supported) return null;

    return (
        <button
            onClick={speaking ? stop : speak}
            className={`btn btn-sm ${speaking ? "btn-primary" : "btn-secondary"} rounded-full px-4`}
        >
            {speaking ? (
                <>
                    <VolumeX size={16} /> 読み上げ停止
                </>
            ) : (
                <>
                    <Volume2 size={16} /> 質問を読み上げる
                </>
            )}
        </button>
    );
}
