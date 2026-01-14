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

  useEffect(() => {
    // Load user ID from localStorage if available
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    }

    // Check if authenticated
    const checkAuth = () => {
      console.log("🔍 Checking authentication status...");
      const isAuth = isAuthenticated();
      console.log("✅ Authenticated:", isAuth);
      setAuthenticated(isAuth);
    };
    
    checkAuth();

    // Listen for storage changes (login/logout from other tabs)
    const handleStorageChange = () => {
      console.log("📝 Storage changed, re-checking auth...");
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleResult = async (text) => {
    // Check authentication
    if (!isAuthenticated()) {
      alert("Please login with Google first to use voice commands");
      return;
    }

    setTranscript(text);
    setResponse("");
    setIsLoading(true);

    try {
      // Get valid access token
      console.log("🎤 Getting access token for voice command...");
      const accessToken = await getAccessToken();
      console.log("✅ Got access token:", accessToken ? `${accessToken.substring(0, 20)}...` : "UNDEFINED");

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

      console.log("📤 Sending to backend:", {
        url: `${backendUrl}/voice`,
        headers: {
          "Authorization": `Bearer ${accessToken ? accessToken.substring(0, 20) : "UNDEFINED"}...`,
        }
      });

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

      // Add to history
      const historyEntry = {
        id: Date.now(),
        command: text,
        response: responseMessage,
        timestamp: new Date().toLocaleTimeString(),
      };
      setHistory([historyEntry, ...history]);

      // Speak the response
      speakResponse(responseMessage);
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

  const speakResponse = (msg) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      speechSynthesis.speak(utterance);
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header with Auth */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">🎯 Voice Assistant</h1>
            <p className="text-gray-600">Send emails and schedule meetings with voice commands</p>
          </div>
          <AuthButton />
        </div>

        {/* Auth Status Alert */}
        {!authenticated && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 font-semibold">⚠️ Please login with Google first</p>
            <p className="text-yellow-700 text-sm">Click the "Login with Google" button to authenticate</p>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          {/* User ID */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                localStorage.setItem("userId", e.target.value);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your user ID"
            />
          </div>

          {/* Voice Input */}
          <div className="text-center mb-8">
            <VoiceInput onResult={handleResult} isLoading={isLoading} />
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">You said:</p>
              <p className="text-lg text-gray-800">{transcript}</p>
            </div>
          )}

          {/* Response */}
          {response && (
            <div
              className={`border rounded-lg p-4 mb-6 ${
                response.includes("✅")
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <p className="text-sm text-gray-600 mb-1">Response:</p>
              <p className="text-lg text-gray-800">{response}</p>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-center items-center gap-2 mb-6">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div
                className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          )}

          {/* Quick Help */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">💡 Try saying:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• "Send an email to john@example.com saying hello"</li>
              <li>• "Schedule a meeting tomorrow at 2 PM"</li>
              <li>• "Create an event called team standup at 10 AM"</li>
            </ul>
          </div>
        </div>

        {/* History Section */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">📋 History</h2>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-blue-500 hover:text-blue-700 text-sm font-semibold"
              >
                {showHistory ? "Hide" : "Show"}
              </button>
            </div>

            {showHistory && (
              <div className="space-y-3">
                {history.map((entry) => (
                  <div key={entry.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="text-xs text-gray-500">{entry.timestamp}</p>
                    <p className="text-sm font-medium text-gray-700 mt-1">Command: {entry.command}</p>
                    <p className="text-sm text-gray-600 mt-1">Result: {entry.response}</p>
                  </div>
                ))}
                <button
                  onClick={clearHistory}
                  className="mt-4 w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition"
                >
                  Clear History
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
