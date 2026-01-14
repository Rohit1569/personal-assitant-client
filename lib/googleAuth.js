"use client";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/gmail.modify",
];

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

// Initialize Google OAuth
export function initGoogleAuth() {
  if (!window.google) {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
}

// Generate auth URL for consent
export function getGoogleAuthUrl() {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Exchange auth code for tokens
export async function exchangeCodeForTokens(code) {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!response.ok) {
      throw new Error("Failed to exchange code for tokens");
    }

    const tokens = await response.json();
    return tokens;
  } catch (error) {
    console.error("Token exchange error:", error);
    throw error;
  }
}

// Store tokens in localStorage
export function storeTokens(tokens) {
  // Ensure expires_in is a valid number, default to 3600 seconds (1 hour)
  const expiresIn = tokens.expires_in || 3600;
  const expiresAtMs = Date.now() + (expiresIn * 1000);
  
  console.log(`📝 storeTokens - expires_in: ${tokens.expires_in}, calculated expiresAt: ${new Date(expiresAtMs).toLocaleString()}`);
  
  const tokenData = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || null,
    expiresAt: expiresAtMs,
    scope: tokens.scope,
  };
  
  console.log(`💾 Storing tokens with expiresAt: ${new Date(expiresAtMs).toLocaleString()}`);
  localStorage.setItem("google_tokens", JSON.stringify(tokenData));
  return tokenData;
}

// Get stored tokens
export function getStoredTokens() {
  const stored = localStorage.getItem("google_tokens");
  if (!stored) return null;

  const tokens = JSON.parse(stored);

  // Check if token is expired
  if (tokens.expiresAt && tokens.expiresAt < Date.now()) {
    // Token expired, need to refresh
    localStorage.removeItem("google_tokens");
    return null;
  }

  return tokens;
}

// Refresh access token using refresh token via backend
export async function refreshAccessToken(refreshToken) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
    
    const response = await fetch(`${backendUrl}/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const newTokens = await response.json();
    storeTokens(newTokens);
    return newTokens;
  } catch (error) {
    console.error("Token refresh error:", error);
    localStorage.removeItem("google_tokens");
    throw error;
  }
}

// Get valid access token (refresh if needed)
export async function getAccessToken() {
  let tokens = getStoredTokens();

  console.log("📍 getAccessToken called, tokens found:", !!tokens);

  if (!tokens) {
    throw new Error("No tokens found. Please authenticate first.");
  }

  console.log("📍 Token expiry check:", {
    expiresAt: new Date(tokens.expiresAt).toLocaleString(),
    now: new Date().toLocaleString(),
    expiresIn: Math.floor((tokens.expiresAt - Date.now()) / 1000) + "s"
  });

  // If token is about to expire (within 5 minutes), refresh it
  if (tokens.refreshToken && tokens.expiresAt - Date.now() < 5 * 60 * 1000) {
    console.log("🔄 Token expiring soon, refreshing...");
    tokens = await refreshAccessToken(tokens.refreshToken);
  }

  console.log("✅ Returning access token:", tokens.accessToken ? `${tokens.accessToken.substring(0, 20)}...` : "UNDEFINED");
  return tokens.accessToken;
}

// Logout
export function logout() {
  localStorage.removeItem("google_tokens");
}

// Check if user is authenticated
export function isAuthenticated() {
  return getStoredTokens() !== null;
}
