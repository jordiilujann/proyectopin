const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

type TokenCache = { access_token: string; expires_at: number } | null;
let tokenCache: TokenCache = null;

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function getAppToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expires_at > now + 5000) {
    return tokenCache.access_token;
  }
  const body = new URLSearchParams();
  body.set("grant_type", "client_credentials");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${env("SPOTIFY_CLIENT_ID")}:${env("SPOTIFY_CLIENT_SECRET")}`).toString("base64"),
    },
    body,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Spotify token error ${res.status}: ${txt}`);
  }
  const json = await res.json() as { access_token: string; expires_in: number };
  tokenCache = {
    access_token: json.access_token,
    expires_at: now + json.expires_in * 1000,
  };
  return tokenCache.access_token;
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

const market = process.env.SPOTIFY_MARKET ?? "ES";

function mapTrack(t: any) {
  const img = t?.album?.images?.[0]?.url ?? null;
  return {
    id: t.id,
    name: t.name,
    artists: (t.artists ?? []).map((a: any) => ({ id: a.id, name: a.name })),
    album: t.album ? { id: t.album.id, name: t.album.name } : null,
    coverUrl: img,
    previewUrl: t.preview_url ?? null,
    popularity: t.popularity ?? null,
    externalUrl: t.external_urls?.spotify ?? null,
    durationMs: t.duration_ms ?? null,
    uri: t.uri ?? null,
  };
}

function mapAlbum(a: any) {
  const img = a?.images?.[0]?.url ?? null;
  return {
    id: a.id,
    name: a.name,
    artists: (a.artists ?? []).map((x: any) => ({ id: x.id, name: x.name })),
    releaseDate: a.release_date ?? null,
    totalTracks: a.total_tracks ?? null,
    coverUrl: img,
    popularity: a.popularity ?? null,
    externalUrl: a.external_urls?.spotify ?? null,
    uri: a.uri ?? null,
  };
}

function mapArtist(a: any) {
  const img = a?.images?.[0]?.url ?? null;
  return {
    id: a.id,
    name: a.name,
    genres: a.genres ?? [],
    images: a.images ?? [],
    popularity: a.popularity ?? null,
    externalUrl: a.external_urls?.spotify ?? null,
    uri: a.uri ?? null,
  };
}

export async function searchTracks(q: string) {
  const token = await getAppToken();
  const url = new URL(`${API_BASE}/search`);
  url.searchParams.set("q", q);
  url.searchParams.set("type", "track");
  url.searchParams.set("limit", "10");
  url.searchParams.set("market", market);
  const res = await fetch(url, { headers: auth(token) });
  if (!res.ok) throw new Error(`search tracks failed ${res.status}`);
  const data = await res.json();
  return (data.tracks?.items ?? []).map(mapTrack);
}

export async function searchAlbums(q: string) {
  const token = await getAppToken();
  const url = new URL(`${API_BASE}/search`);
  url.searchParams.set("q", q);
  url.searchParams.set("type", "album");
  url.searchParams.set("limit", "10");
  url.searchParams.set("market", market);
  const res = await fetch(url, { headers: auth(token) });
  if (!res.ok) throw new Error(`search albums failed ${res.status}`);
  const data = await res.json();
  return (data.albums?.items ?? []).map(mapAlbum);
}

export async function getTrackById(id: string) {
  const token = await getAppToken();
  const res = await fetch(`${API_BASE}/tracks/${id}?market=${market}`, { headers: auth(token) });
  if (!res.ok) throw new Error(`get track failed ${res.status}`);
  return mapTrack(await res.json());
}

export async function getAlbumById(id: string) {
  const token = await getAppToken();
  const res = await fetch(`${API_BASE}/albums/${id}?market=${market}`, { headers: auth(token) });
  if (!res.ok) throw new Error(`get album failed ${res.status}`);
  return mapAlbum(await res.json());
}

export async function searchArtists(q: string) {
  const token = await getAppToken();
  const url = new URL(`${API_BASE}/search`);
  url.searchParams.set("q", q);
  url.searchParams.set("type", "artist");
  url.searchParams.set("limit", "10");
  url.searchParams.set("market", market);
  const res = await fetch(url, { headers: auth(token) });
  if (!res.ok) throw new Error(`search artists failed ${res.status}`);
  const data = await res.json();
  return (data.artists?.items ?? []).map(mapArtist);
}

export async function getArtistById(id: string) {
  const token = await getAppToken();
  const res = await fetch(`${API_BASE}/artists/${id}`, { headers: auth(token) });
  if (!res.ok) throw new Error(`get artist failed ${res.status}`);
  return mapArtist(await res.json());
}

