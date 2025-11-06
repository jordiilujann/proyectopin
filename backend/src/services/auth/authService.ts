import { Response } from "express";

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_URL = "https://api.spotify.com/v1";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI!;

export function getLoginUrl(): string {
  const state = Math.random().toString(36).substring(7);
  const scope = "user-read-private user-read-email";
  
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    state,
    scope,
  });

  return `${SPOTIFY_AUTH_URL}?${params}`;
}

export async function exchangeCodeForTokens(code: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Error al intercambiar el código por tokens:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    });
    throw new Error(`Failed to exchange code for tokens: ${response.status} ${response.statusText} ${errorText}`);
  }
  
  return await response.json();
}

export async function refreshAccessToken(refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
    },
    body,
  });

  if (!response.ok) throw new Error("Failed to refresh token");
  
  return await response.json();
}

export async function getUserProfile(accessToken: string) {
  const response = await fetch(`${SPOTIFY_API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Error al obtener el perfil de Spotify:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    });
    throw new Error(`Failed to fetch user profile: ${response.status} ${response.statusText} ${errorText}`);
  }
  
  return await response.json();
}

export function setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
  const cookieOptions = {
    httpOnly: true,
    path: "/",
    domain: "127.0.0.1",
  };
  
  res.cookie("spotify_access_token", accessToken, {
    ...cookieOptions,
    maxAge: 3600 * 1000,
  });

  res.cookie("spotify_refresh_token", refreshToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 3600 * 1000,
  });
}

export function clearTokenCookies(res: Response) {
  res.clearCookie("spotify_access_token");
  res.clearCookie("spotify_refresh_token");
}

