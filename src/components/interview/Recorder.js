"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, RefreshCw, Upload, Video as VideoIcon } from "lucide-react";

export default function Recorder({ mode = "record", timeLimit = 60, onComplete }) {
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recognitionRef = useRef(null);
    const chunksRef = useRef([]);

    const [stream, setStream] = useState(null);
    const [recording, setRecording] = useState(false);
    const [timeLeft, setTimeLeft] = useState(timeLimit);
    const [videoUrl, setVideoUrl] = useState(null);
    const [transcript, setTranscript] = useState("");
    const [uploading, setUploading] = useState(false);
    const [permissionError, setPermissionError] = useState(false);

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    useEffect(() => {
        if (timeLimit === 0) return; // Infinite time limit

        if (recording && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && recording) {
            stopRecording();
        }
    }, [recording, timeLeft, timeLimit]);

    async function startCamera() {
        try {
            const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(s);
            if (videoRef.current) {
                videoRef.current.srcObject = s;
            }
            setPermissionError(false);
        } catch (err) {
            console.error("Camera access denied:", err);
            setPermissionError(true);
        }
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
    }

    function startRecording() {
        if (!stream) return;

        setVideoUrl(null);
        setTranscript("");
        chunksRef.current = [];
        setTimeLeft(timeLimit);

        // Setup MediaRecorder
        const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunksRef.current.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: "video/webm" });
            const url = URL.createObjectURL(blob);
            setVideoUrl(url);
        };

        mediaRecorder.start();

        // Setup SpeechRecognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "ja-JP"; // Default to Japanese as per user request context

            recognition.onresult = (event) => {
                let finalTranscript = "";
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setTranscript((prev) => prev + " " + finalTranscript);
                }
            };

            recognition.start();
            recognitionRef.current = recognition;
        }

        setRecording(true);
    }

    function stopRecording() {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop();
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setRecording(false);
        }
    }

    async function handleUpload() {
        if (!videoUrl) return;
        setUploading(true);

        try {
            const blob = await fetch(videoUrl).then((r) => r.blob());
            const formData = new FormData();
            formData.append("file", blob, "recording.webm");
            formData.append("type", "private");

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();

            if (data.success) {
                onComplete(data.url, transcript.trim());
            } else {
                alert("Upload failed");
            }
        } catch (error) {
            console.error("Upload error", error);
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    }

    if (permissionError) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-destructive/10 text-destructive p-4 text-center">
                <VideoIcon size={48} className="mb-4" />
                <h3 className="text-lg font-bold">カメラへのアクセスが拒否されました</h3>
                <p>続行するにはカメラとマイクへのアクセスを許可してください。</p>
                <button onClick={startCamera} className="btn btn-secondary mt-4">
                    再試行
                </button>
            </div>
        );
    }

    // Check Mode (Preview Only)
    if (mode === "check") {
        return (
            <div className="relative w-full h-full min-h-[300px] bg-black rounded-lg overflow-hidden">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <button onClick={onComplete} className="btn btn-primary">
                        問題ありません
                    </button>
                </div>
            </div>
        );
    }

    // Record Mode
    return (
        <div className="relative w-full h-full bg-black">
            {!videoUrl ? (
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                />
            ) : (
                <video
                    src={videoUrl}
                    controls
                    className="w-full h-full object-contain"
                />
            )}

            {/* Overlay Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col items-center gap-4">

                {recording && timeLimit > 0 && (
                    <div className="text-red-500 font-mono font-bold text-xl animate-pulse bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                    </div>
                )}

                <div className="flex items-center gap-4 sm:gap-6">
                    {!videoUrl ? (
                        !recording ? (
                            <button
                                onClick={startRecording}
                                className="btn btn-primary rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Mic size={32} className="sm:w-10 sm:h-10" />
                            </button>
                        ) : (
                            <button
                                onClick={stopRecording}
                                className="btn btn-destructive rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                            >
                                <Square size={32} fill="currentColor" className="sm:w-10 sm:h-10" />
                            </button>
                        )
                    ) : (
                        <>
                            <button
                                onClick={() => setVideoUrl(null)}
                                className="btn btn-secondary rounded-full px-6 py-3 active:scale-95 transition-transform"
                                disabled={uploading}
                            >
                                <RefreshCw size={20} /> <span className="hidden sm:inline ml-2">撮り直す</span>
                            </button>
                            <button
                                onClick={handleUpload}
                                className="btn btn-primary rounded-full px-8 py-3 active:scale-95 transition-transform shadow-lg shadow-primary/20"
                                disabled={uploading}
                            >
                                {uploading ? "送信中..." : "回答を送信"} <Upload size={20} className="ml-2" />
                            </button>
                        </>
                    )}
                </div>

                {(transcript || videoUrl) && (
                    <div className="w-full bg-black/60 backdrop-blur-md p-3 rounded-lg border border-white/10 animate-fade-in text-left">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-primary/80 text-xs">文字起こし (編集可)</span>
                            {recording && <span className="text-[10px] text-red-400 animate-pulse">録音中...</span>}
                        </div>
                        <textarea
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            className="w-full bg-black/50 text-sm text-white resize-none focus:outline-none min-h-[60px] max-h-[120px] scrollbar-thin scrollbar-thumb-white/20 p-2 rounded"
                            placeholder="音声認識結果が表示されます..."
                            readOnly={recording}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
