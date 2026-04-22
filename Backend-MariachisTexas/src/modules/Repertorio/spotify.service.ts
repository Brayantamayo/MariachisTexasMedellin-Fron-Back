// src/modules/spotify/spotify.service.ts
import { spotifyConfig } from '../../config/spotify';

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

interface SpotifyTokenResponse {
  access_token: string;
  expires_in: number;
}

// ─── Obtener token con reintentos ──────────────────────────────────────────
const getAccessToken = async (): Promise<string> => {
  // Si el token aún es válido (con 60s de margen) reutilizarlo
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const credentials = Buffer.from(`${spotifyConfig.clientId}:${spotifyConfig.clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Spotify token error (${response.status}): ${errorText}`);
  }

  const data: SpotifyTokenResponse = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedToken;
};

// ─── Función con reintentos para manejar 401 (token expirado) ─────────────────
const fetchWithRetry = async (url: string, token: string, maxRetries = 2): Promise<Response> => {
  let currentToken = token;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      if (res.status === 401 && attempt < maxRetries) {
        // Token expirado, renovamos y reintentamos
        currentToken = await getAccessToken();
        continue;
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Spotify API error (${res.status}): ${errorText}`);
      }

      return res; // Éxito
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxRetries) break;
      // Espera antes de reintentar (backoff simple)
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }

  throw lastError || new Error('Error desconocido en fetchWithRetry');
};

// ─── Interfaces de Spotify ───────────────────────────────────────────────────
export interface SpotifySong {
  spotifyId: string;
  title: string;
  artist: string;
  album: string;
  coverImage: string | null;
  previewUrl: string | null;
  duration: string;    // "M:SS"
  durationMs: number;
  popularity: number;
  externalUrl: string;
}

const msToMinutes = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// ─── Mercados a probar en orden para conseguir preview_url ──────────────────
const MARKETS_FALLBACK = ['CO', 'MX', 'US', 'ES', 'AR', 'CL', 'PE', 'EC', 'VE'];

/**
 * Intenta obtener el preview_url de una canción probando distintos mercados.
 * Spotify eliminó preview_url para muchas regiones — probando varios mercados
 * aumentamos las posibilidades de encontrar uno.
 */
const findPreviewUrl = async (
  trackId: string,
  token: string
): Promise<string | null> => {
  for (const market of MARKETS_FALLBACK) {
    try {
      const res = await fetchWithRetry(
        `https://api.spotify.com/v1/tracks/${trackId}?market=${market}`,
        token
      );
      const track = await res.json();
      if (track.preview_url) {
        return track.preview_url;
      }
    } catch {
      // si falla en este mercado, seguir con el siguiente
    }
  }
  return null;
};

// ─── Búsqueda principal ──────────────────────────────────────────────────────
export const searchSongs = async (
  query: string,
  limit = 10,
  market = 'CO'
): Promise<SpotifySong[]> => {
  if (!query.trim()) {
    throw new Error('La búsqueda no puede estar vacía');
  }

  // Validar límite (Spotify acepta hasta 50)
  const safeLimit = Math.min(Math.max(1, limit), 50);
  const token = await getAccessToken();

  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${safeLimit}&market=${market}`;

  const response = await fetchWithRetry(url, token);
  const data = await response.json();

  // Validar que la respuesta tenga la estructura esperada
  if (!data.tracks?.items) {
    console.warn('Estructura inesperada de Spotify:', data);
    return [];
  }

  // Mapear tracks y buscar preview_url en múltiples mercados si viene null
  const tracks: SpotifySong[] = await Promise.all(
    data.tracks.items.map(async (track: any): Promise<SpotifySong> => {
      // Intentar obtener preview_url probando distintos mercados
      const previewUrl = track.preview_url
        ?? await findPreviewUrl(track.id, token);

      return {
        spotifyId:   track.id,
        title:       track.name,
        artist:      track.artists.map((a: any) => a.name).join(', '),
        album:       track.album.name,
        coverImage:  track.album.images?.[0]?.url ?? null,
        previewUrl,
        duration:    msToMinutes(track.duration_ms),
        durationMs:  track.duration_ms,
        popularity:  track.popularity,
        externalUrl: track.external_urls.spotify,
      };
    })
  );

  return tracks;
};