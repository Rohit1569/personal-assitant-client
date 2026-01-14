"use client";

import { useEffect, useState } from "react";
import { getGoogleAuthUrl, isAuthenticated, logout } from "../lib/googleAuth";

export default function AuthButton() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
    setAuthenticated(isAuthenticated());
  }, []);

  const handleLogin = () => {
    // Redirect to backend OAuth initiation endpoint
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
    window.location.href = `${backendUrl}/auth/google`;
  };

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
  };

  if (loading) {
    return (
      <button disabled className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg">
        Loading...
      </button>
    );
  }

  if (authenticated) {
    return (
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition"
      >
        📍 Logout
      </button>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition"
    >
      🔐 Login with Google
    </button>
  );
}
