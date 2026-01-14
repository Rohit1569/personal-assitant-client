"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  storeTokens,
  getGoogleAuthUrl,
} from "../../../../lib/googleAuth";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing authentication...");
  const [error, setError] = useState(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        // Get tokens from URL (either from backend as base64 or from direct OAuth)
        const params = new URLSearchParams(window.location.search);
        const encodedTokens = params.get("tokens");
        const code = params.get("code");

        let tokens = null;

        if (encodedTokens) {
          // Backend provided tokens (from http://localhost:4000/auth/google/callback)
          try {
            const decodedString = atob(encodedTokens);
            const decodedTokens = JSON.parse(decodedString);
            tokens = decodedTokens;
            console.log("✅ Tokens received from backend");
          } catch (e) {
            console.error("Failed to decode tokens:", e);
          }
        } else if (code) {
          // Code from frontend OAuth flow
          throw new Error(
            "Direct frontend OAuth not configured. Please use backend callback."
          );
        } else {
          throw new Error("No tokens or authorization code in URL");
        }

        if (!tokens || !tokens.access_token) {
          throw new Error("Invalid token data received");
        }

        setStatus("Storing tokens...");

        // Store tokens
        storeTokens(tokens);

        setStatus("✅ Authentication successful!");

        // Redirect to home after 1 second
        setTimeout(() => {
          router.push("/");
        }, 1000);
      } catch (err) {
        console.error("Auth error:", err);
        setError(err.message);
        setStatus("❌ Authentication failed");
      }
    }

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          🔐 Authentication
        </h1>

        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">{status}</p>

          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 mb-4">{error}</p>
              <a
                href={getGoogleAuthUrl()}
                className="inline-block px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition"
              >
                Try Again
              </a>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
