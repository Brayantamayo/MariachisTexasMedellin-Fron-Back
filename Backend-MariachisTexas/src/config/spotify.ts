// src/config/spotify.ts
export const spotifyConfig = {
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
};

if (!spotifyConfig.clientId || !spotifyConfig.clientSecret) {
  throw new Error('Faltan variables de entorno de Spotify (SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET)');
}