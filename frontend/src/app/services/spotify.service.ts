import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: { id: string; name: string };
  coverUrl: string | null;
  previewUrl: string | null;
  popularity: number | null;
  externalUrl: string | null;
  durationMs: number | null;
  uri: string | null;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  releaseDate: string | null;
  totalTracks: number | null;
  coverUrl: string | null;
  popularity: number | null;
  externalUrl: string | null;
  uri: string | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  images: { url: string; height: number; width: number }[];
  popularity: number | null;
  externalUrl: string | null;
  uri: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  private apiUrl = '/api/spotify';

  constructor(private http: HttpClient) {}

  searchTracks(query: string): Observable<SpotifyTrack[]> {
    return this.http.get<SpotifyTrack[]>(`${this.apiUrl}/tracks?q=${encodeURIComponent(query)}`);
  }

  searchAlbums(query: string): Observable<SpotifyAlbum[]> {
    return this.http.get<SpotifyAlbum[]>(`${this.apiUrl}/albums?q=${encodeURIComponent(query)}`);
  }

  searchArtists(query: string): Observable<SpotifyArtist[]> {
    return this.http.get<SpotifyArtist[]>(`${this.apiUrl}/artists?q=${encodeURIComponent(query)}`);
  }

  getTrackById(id: string): Observable<SpotifyTrack> {
    return this.http.get<SpotifyTrack>(`${this.apiUrl}/tracks/${id}`);
  }

  getAlbumById(id: string): Observable<SpotifyAlbum> {
    return this.http.get<SpotifyAlbum>(`${this.apiUrl}/albums/${id}`);
  }

  getArtistById(id: string): Observable<SpotifyArtist> {
    return this.http.get<SpotifyArtist>(`${this.apiUrl}/artists/${id}`);
  }

  // Método para buscar cualquier tipo de contenido
  searchAll(query: string): Observable<{
    tracks: SpotifyTrack[];
    albums: SpotifyAlbum[];
    artists: SpotifyArtist[];
  }> {
    // Hacer llamadas individuales ya que no existe el endpoint /search combinado
    return new Observable(observer => {
      let tracks: SpotifyTrack[] = [];
      let albums: SpotifyAlbum[] = [];
      let artists: SpotifyArtist[] = [];
      let completed = 0;
      const total = 3;

      const checkCompletion = () => {
        completed++;
        if (completed === total) {
          // Limitar resultados: 5 tracks y 3 albums como solicitado
          observer.next({ 
            tracks: tracks.slice(0, 5), 
            albums: albums.slice(0, 3), 
            artists 
          });
          observer.complete();
        }
      };

      // Buscar tracks
      this.searchTracks(query).subscribe({
        next: (result) => {
          tracks = result;
          checkCompletion();
        },
        error: () => checkCompletion()
      });

      // Buscar albums
      this.searchAlbums(query).subscribe({
        next: (result) => {
          albums = result;
          checkCompletion();
        },
        error: () => checkCompletion()
      });

      // Buscar artists
      this.searchArtists(query).subscribe({
        next: (result) => {
          artists = result;
          checkCompletion();
        },
        error: () => checkCompletion()
      });
    });
  }
}