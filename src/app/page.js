"use client";

import { useState, useEffect } from "react";
import VoiceInput from "../../components/VoiceInput";
import AuthButton from "../../components/AuthButton";
import { getAccessToken, isAuthenticated } from "../../lib/googleAuth";

export default function VoiceAssistant() {
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [history, setHistory] = useState([]);
  const [userId, setUserId] = useState("user123");
  const [showHistory, setShowHistory] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    }

    const checkAuth = () => {
      const isAuth = isAuthenticated();
      setAuthenticated(isAuth);
    };

    checkAuth();

    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleResult = async (text) => {
    if (!isAuthenticated()) {
      alert("Please login with Google first to use voice commands");
      return;
    }

    setTranscript(text);
    setResponse("");
    setIsLoading(true);

    try {
      const accessToken = await getAccessToken();
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

      const res = await fetch(`${backendUrl}/voice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId, text }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.statusText}`);
      }

      const data = await res.json();

      const responseMessage =
        data.success || data.status === "SUCCESS"
          ? data.message || "✅ Action completed successfully!"
          : data.message || "❌ Could not process your request";

      setResponse(responseMessage);

      const historyEntry = {
        id: Date.now(),
        command: text,
        response: responseMessage,
        timestamp: new Date().toLocaleTimeString(),
      };
      setHistory([historyEntry, ...history]);

      // If in live mode, stay in live mode loop
      speakResponse(responseMessage, () => {
        if (liveMode) {
          // The VoiceInput component will handle the listening state
        }
      });
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = `Sorry, I encountered an error: ${error.message}`;
      setResponse(errorMessage);
      speakResponse(errorMessage);

      const historyEntry = {
        id: Date.now(),
        command: text,
        response: errorMessage,
        timestamp: new Date().toLocaleTimeString(),
      };
      setHistory([historyEntry, ...history]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakResponse = (msg, onEndCallback) => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.rate = 1.0;
      utterance.pitch = 0.9;
      utterance.volume = 1;

      utterance.onend = () => {
        setIsSpeaking(false);
        if (onEndCallback) onEndCallback();
      };

      speechSynthesis.speak(utterance);
    }
  };

  const toggleLiveMode = () => {
    if (liveMode) {
      speechSynthesis.cancel();
      setLiveMode(false);
    } else {
      if (!authenticated) {
        alert("Please login first to establish a live link.");
        return;
      }
      setLiveMode(true);
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <main className="min-h-screen p-6 md:p-12 relative overflow-hidden">
      {/* Background HUD elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 border-l-2 border-t-2 border-jarvis-blue"></div>
        <div className="absolute top-10 right-10 w-32 h-32 border-r-2 border-t-2 border-jarvis-blue"></div>
        <div className="absolute bottom-10 left-10 w-32 h-32 border-l-2 border-b-2 border-jarvis-blue"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 border-r-2 border-b-2 border-jarvis-blue"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <header className="flex justify-between items-start mb-16">
          <div className="space-y-1">
            <h1 className="text-5xl font-bold tracking-tighter text-jarvis-blue glow-blue italic uppercase">
              Personal Assistant.
            </h1>
            <p className="text-xs font-mono text-jarvis-blue/60 tracking-[0.3em] uppercase">
              Just A Rather Very Intelligent System
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <AuthButton />
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${authenticated ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className="text-[10px] font-mono uppercase text-jarvis-blue/40 tracking-widest">
                  {authenticated ? 'Uplink Stable' : 'Uplink Offline'}
                </span>
              </div>
              <button
                onClick={toggleLiveMode}
                className={`text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-1 border transition-all duration-300 ${liveMode
                    ? 'bg-jarvis-blue/20 border-jarvis-blue text-jarvis-blue glow-blue'
                    : 'bg-transparent border-jarvis-blue/20 text-jarvis-blue/40 hover:border-jarvis-blue/60'
                  }`}
              >
                {liveMode ? '● LIVE SESSION ACTIVE' : '■ INITIATE LIVE LINK'}
              </button>
            </div>
          </div>
        </header>

        {/* Main Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Input & Status */}
          <div className="lg:col-span-12 xl:col-span-12 flex flex-col items-center">
            <div className="w-full jarvis-border p-12 mb-8 flex flex-col items-center justify-center min-h-[400px]">
              {/* User ID Input - Hover HUD style */}
              {/* <div className="absolute top-4 left-4 flex flex-col gap-1">
                <span className="text-[10px] font-mono text-jarvis-blue/40 uppercase">User Identification</span>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    localStorage.setItem("userId", e.target.value);
                  }}
                  className="bg-transparent border-b border-jarvis-blue/20 text-jarvis-blue font-mono text-sm focus:outline-none focus:border-jarvis-blue transition-colors"
                />
              </div> */}

              <VoiceInput
                onResult={handleResult}
                isLoading={isLoading}
                isSpeaking={isSpeaking}
                autoStart={liveMode}
              />

              {/* Live Transcript Display */}
              <div className="w-full max-w-xl mt-8 h-20 flex flex-col items-center justify-center">
                {transcript && (
                  <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <p className="text-[10px] font-mono text-jarvis-blue/40 uppercase mb-2 tracking-widest">Voice Decrypted</p>
                    <p className="text-xl text-foreground font-medium italic">"{transcript}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Response Panel */}
          {response && (
            <div className="lg:col-span-12 animate-in zoom-in-95 duration-300">
              <div className={`jarvis-border p-8 border-l-4 ${response.includes("✅") ? 'border-l-jarvis-blue' : 'border-l-red-500'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-2 h-2 rounded-full ${response.includes("✅") ? 'bg-jarvis-blue' : 'bg-red-500'} animate-ping`}></div>
                  <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-jarvis-blue/60">System Response</h3>
                </div>
                <p className="text-2xl font-light text-foreground leading-relaxed">
                  {response}
                </p>
              </div>
            </div>
          )}

          {/* Secondary Info Rows */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Quick Command Reference */}
            <div className="jarvis-border p-6">
              <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-jarvis-blue/60 mb-4 flex items-center gap-2">
                <span className="w-4 h-[1px] bg-jarvis-blue/40"></span> Command Protocols
              </h3>
              <ul className="space-y-2 font-mono text-xs text-jarvis-blue/80">
                <li className="flex gap-3 hover:text-jarvis-blue cursor-default transition-colors">
                  <span className="text-jarvis-blue opacity-50">01</span>
                  "Send an email to [Name] regarding [Subject]"
                </li>
                <li className="flex gap-3 hover:text-jarvis-blue cursor-default transition-colors">
                  <span className="text-jarvis-blue opacity-50">02</span>
                  "Schedule a meeting at [Time] for [Purpose]"
                </li>
                <li className="flex gap-3 hover:text-jarvis-blue cursor-default transition-colors">
                  <span className="text-jarvis-blue opacity-50">03</span>
                  "Cancel my appointment with [Name]"
                </li>
              </ul>
            </div>

            {/* History Feed */}
            {history.length > 0 && (
              <div className="jarvis-border p-6 overflow-hidden max-h-[300px] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-jarvis-blue/60 flex items-center gap-2">
                    <span className="w-4 h-[1px] bg-jarvis-blue/40"></span> Mission Logs
                  </h3>
                  <button
                    onClick={clearHistory}
                    className="text-[10px] font-mono text-red-400/60 uppercase hover:text-red-400 transition-colors"
                  >
                    Purge
                  </button>
                </div>
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                  {history.map((entry) => (
                    <div key={entry.id} className="border-l border-jarvis-blue/20 pl-3 py-1 group">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-mono text-jarvis-blue/30">{entry.timestamp}</span>
                        <span className="text-[9px] font-mono text-jarvis-blue/30 uppercase opacity-0 group-hover:opacity-100 transition-opacity">Executed</span>
                      </div>
                      <p className="text-xs font-medium text-jarvis-blue/90 line-clamp-1">{entry.command}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Stats */}
        <footer className="mt-16 pt-8 border-t border-jarvis-blue/10 flex justify-between items-end">
          <div className="flex gap-12">
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-jarvis-blue/40 uppercase tracking-widest">Core Temp</p>
              <p className="text-sm font-mono text-jarvis-blue animate-[data-flow_2s_infinite]">32°C [STABLE]</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-jarvis-blue/40 uppercase tracking-widest">Neural Link</p>
              <p className="text-sm font-mono text-jarvis-blue">Active [98.2%]</p>
            </div>
          </div>
          <p className="text-[9px] font-mono text-jarvis-blue/20 uppercase">Property of Stark Industries &copy; 2026</p>
        </footer>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(14, 165, 233, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(14, 165, 233, 0.2);
        }
      `}</style>
    </main>
  );
}
