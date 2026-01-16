"use client";

import { useState, useRef } from "react";

export default function VoiceInput({ onResult, isLoading = false }) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  const startListening = () => {
    setError(null);

    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setError("Your browser does not support Speech Recognition!");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech") {
        setError(`Error: ${event.error}`);
      }
      setListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      setError("Could not start speech recognition");
      console.error(err);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-10">
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Outer Rotating Ring 1 */}
        <div className={`absolute inset-0 border-2 border-jarvis-blue/20 rounded-full border-t-jarvis-blue/60 ${listening ? 'animate-[spin-slow_3s_linear_infinite]' : 'animate-[spin-slow_10s_linear_infinite]'}`}></div>

        {/* Outer Rotating Ring 2 */}
        <div className={`absolute inset-4 border border-jarvis-blue/10 rounded-full border-b-jarvis-blue/40 ${listening ? 'animate-[spin-back_2s_linear_infinite]' : 'animate-[spin-back_15s_linear_infinite]'}`}></div>

        {/* Inner Pulsing Core */}
        <button
          onClick={listening ? stopListening : startListening}
          disabled={isLoading}
          className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 overflow-hidden
            ${listening
              ? "bg-red-500/20 border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] scale-110"
              : isLoading
                ? "bg-gray-800 border-2 border-gray-600 cursor-wait"
                : "bg-jarvis-blue/10 border-2 border-jarvis-blue shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:scale-105"
            }`}
        >
          {/* Scanning Effect inside button */}
          {listening && <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>}

          <div className="flex flex-col items-center">
            {isLoading ? (
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-jarvis-blue rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-jarvis-blue rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-jarvis-blue rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            ) : (
              <span className={`text-2xl ${listening ? 'text-red-500' : 'text-jarvis-blue'}`}>
                {listening ? "●" : "⚡"}
              </span>
            )}
          </div>
        </button>

        {/* Decorative Elements */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-jarvis-blue/60 font-mono">
          System Status: {isLoading ? 'Processing' : listening ? 'Listening' : 'Ready'}
        </div>
      </div>

      <div className="text-center">
        <p className={`text-sm tracking-[0.2em] uppercase font-semibold transition-colors
          ${listening ? 'text-red-400' : 'text-jarvis-blue/80'}`}>
          {isLoading ? "Analyzing voice patterns..." : listening ? "Receiving Transmission..." : "Initialize Command"}
        </p>
        {error && <p className="text-red-500 text-xs mt-2 font-mono">[{error}]</p>}
      </div>
    </div>
  );
}
