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
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setError(`Error: ${event.error}`);
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
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={listening ? stopListening : startListening}
        disabled={isLoading}
        className={`px-6 py-3 rounded-lg font-semibold transition-all ${
          listening
            ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
            : isLoading
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600 text-white"
        }`}
      >
        {isLoading ? "Processing..." : listening ? "Listening... (Click to stop)" : "🎤 Speak"}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
