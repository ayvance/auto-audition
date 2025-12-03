"use client";

import { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";

export default function QuestionReader({ text }) {
    const [speaking, setSpeaking] = useState(false);
    const [supported, setSupported] = useState(false);

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
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);

        // Try to select a Japanese voice if available, since the user is likely Japanese
        // or English if the text is English. The prompt was in Japanese but my code is English.
        // I'll just let the browser decide or pick a default.
        // Actually, I should check the text language or user locale.
        // I'll stick to default.

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
