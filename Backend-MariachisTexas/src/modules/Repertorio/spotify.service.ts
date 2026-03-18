// ─── Spotify Service — Client Credentials Flow ───────────────────────────────
// Obtiene un token de acceso automáticamente y lo renueva cuando expira.
// Las credenciales viven solo en el backend — el frontend nunca las ve.

let cachedToken:   string | null = null
let tokenExpiresAt: number       = 0

// ─── Obtener / renovar Access Token ──────────────────────────────────────────
const getAccessToken = async (): Promise<string> => {
  // Si el token aún es válido (con 60s de margen) reutilizarlo
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken

  const clientId     = process.env.SPOTIFY_CLIENT_ID!
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!
  const credentials  = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method:  'POST',
    headers: {
      Authorization:  `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Spotify token error: ${err}`)
  }

  const data      = await res.json()
  cachedToken     = data.access_token
  tokenExpiresAt  = Date.now() + data.expires_in * 1000  // expires_in = 3600s

  return cachedToken!
}

// ─── Buscar canciones ─────────────────────────────────────────────────────────
export interface SpotifySong {
  spotifyId:   string
  title:       string
  artist:      string
  album:       string
  coverImage:  string | null
  previewUrl:  string | null
  duration:    string          // formato "M:SS"
  durationMs:  number
  popularity:  number
  externalUrl: string
}

const msToMinutes = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const searchSongs = async (query: string, limit = 10): Promise<SpotifySong[]> => {
  if (!query.trim()) throw new Error('La búsqueda no puede estar vacía')

  const token = await getAccessToken()
  const url   = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}&market=CO`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Spotify search error: ${err}`)
  }

  const data = await res.json()

  return data.tracks.items.map((track: any): SpotifySong => ({
    spotifyId:   track.id,
    title:       track.name,
    artist:      track.artists.map((a: any) => a.name).join(', '),
    album:       track.album.name,
    coverImage:  track.album.images?.[0]?.url ?? null,
    previewUrl:  track.preview_url,
    duration:    msToMinutes(track.duration_ms),
    durationMs:  track.duration_ms,
    popularity:  track.popularity,
    externalUrl: track.external_urls.spotify,
  }))
}