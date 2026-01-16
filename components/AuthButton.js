"use client";

import { useEffect, useState } from "react";
import { isAuthenticated, logout } from "../lib/googleAuth";

export default function AuthButton() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
    setAuthenticated(isAuthenticated());
  }, []);

  const handleLogin = () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
    window.location.href = `${backendUrl}/auth/google`;
  };

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
  };

  if (loading) {
    return (
      <button disabled className="px-6 py-2 border border-jarvis-blue/20 text-jarvis-blue/40 font-mono text-xs uppercase tracking-widest">
        Syncing...
      </button>
    );
  }

  if (authenticated) {
    return (
      <button
        onClick={handleLogout}
        className="px-6 py-2 border border-red-500/50 hover:bg-red-500/10 text-red-400 font-mono text-xs uppercase tracking-widest transition-all duration-300"
      >
        [ Terminate Uplink ]
      </button>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="px-6 py-2 border border-jarvis-blue hover:bg-jarvis-blue/10 text-jarvis-blue font-mono text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(14,165,233,0.2)]"
    >
      [ Initialize Uplink ]
    </button>
  );
}
