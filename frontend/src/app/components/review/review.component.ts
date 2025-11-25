import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SpotifyService, SpotifyTrack, SpotifyAlbum, SpotifyArtist } from '../../services/spotify.service';
import { AuthService } from '../../services/auth.service';

interface SearchResult {
  tracks: SpotifyTrack[];
  albums: SpotifyAlbum[];
  artists: SpotifyArtist[];
}

interface SelectedItem {
  id: string;
  name: string;
  type: 'track' | 'album' | 'artist';
  artists?: { name: string }[];
  genre?: string;
  coverUrl?: string;
}

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './review.component.html',
})

export class ReviewComponent implements OnInit {
  searchQuery: string = '';
  searchResults: SearchResult = { tracks: [], albums: [], artists: [] };
  selectedItem: SelectedItem | null = null;
  rating: number = 0;
  title: string = '';
  content: string = '';
  timestampMs: number | null = null;
  trackDurationMs: number | null = null;
  isLoading: boolean = false;
  error: string = '';

  constructor(
    private spotifyService: SpotifyService,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {}

  search() {
    if (!this.searchQuery.trim()) return;

    this.isLoading = true;
    this.error = '';

    this.spotifyService.searchAll(this.searchQuery).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Error al buscar contenido';
        this.isLoading = false;
        console.error('Error searching:', error);
      }
    });
  }

  selectItem(item: SpotifyTrack | SpotifyAlbum | SpotifyArtist, type: 'track' | 'album' | 'artist') {
    // Obtener la URL de la imagen según el tipo de item
    let coverUrl: string | undefined;
    
    if ('coverUrl' in item && item.coverUrl) {
      coverUrl = item.coverUrl;
    } else if ('images' in item && item.images.length > 0) {
      coverUrl = item.images[0].url;
    }
    
    this.selectedItem = {
      id: item.id,
      name: item.name,
      type: type,
      coverUrl: coverUrl
    };

    // Extraer información adicional basada en el tipo
    if (type === 'track' && 'artists' in item) {
      this.timestampMs = 0;
      this.selectedItem.artists = item.artists;
      // Obtener la duración de la canción
      if ('durationMs' in item && item.durationMs) {
        this.trackDurationMs = item.durationMs;
      } else {
        // Si no viene en el resultado de búsqueda, obtenerlo por ID
        this.spotifyService.getTrackById(item.id).subscribe({
          next: (track) => {
            this.trackDurationMs = track.durationMs;
          },
          error: (error) => {
            console.error('Error getting track duration:', error);
            this.trackDurationMs = null;
          }
        });
      }
      // Para tracks, intentamos obtener el género del primer artista
      if (item.artists.length > 0) {
        this.getArtistGenre(item.artists[0].id);
      }
    } else {
      // Si no es un track, limpiar la duración y el timestamp
      this.trackDurationMs = null;
      this.timestampMs = null;
    }

    if (type === 'album' && 'artists' in item) {
      this.selectedItem.artists = item.artists;
    } else if (type === 'artist' && 'genres' in item) {
      // Para artistas, usamos el primer género disponible
      this.selectedItem.genre = item.genres.length > 0 ? item.genres[0] : undefined;
    }

    // Limpiar resultados de búsqueda después de seleccionar
    this.searchResults = { tracks: [], albums: [], artists: [] };
    this.searchQuery = '';
  }

  getArtistGenre(artistId: string) {
    this.spotifyService.getArtistById(artistId).subscribe({
      next: (artist) => {
        if (artist.genres.length > 0 && this.selectedItem) {
          this.selectedItem.genre = artist.genres[0];
        }
      },
      error: (error) => {
        console.error('Error getting artist genre:', error);
      }
    });
  }

  setRating(stars: number) {
    this.rating = stars;
  }

  submitReview() {
    if (!this.selectedItem || this.rating === 0) {
      this.error = 'Por favor selecciona un item y establece una valoración';
      return;
    }

    // Validar timestamp si es un track
    if (this.selectedItem.type === 'track' && this.timestampMs !== null) {
      if (this.trackDurationMs && this.timestampMs > this.trackDurationMs) {
        this.error = `El momento exacto no puede ser mayor a la duración de la canción (${this.formatDuration(this.trackDurationMs)})`;
        return;
      }
    }

    const reviewData: any = {
      spotify_id: this.selectedItem.id,
      target_type: this.selectedItem.type,
      rating: this.rating,
      genre: this.selectedItem.genre || '', // Cadena vacía si no hay género
      content: this.content,
      title: this.title
    };

    // Solo incluir timestamp_ms si es un track (usar 0 por defecto)
    if (this.selectedItem.type === 'track') {
      const sanitizedTimestamp = this.timestampMs ?? 0;
      reviewData.timestamp_ms = Math.max(0, Math.floor(sanitizedTimestamp));
    }

    // Obtener el token de acceso de Spotify desde localStorage
    const accessToken = this.authService.getAccessToken();
    
    if (!accessToken) {
      this.error = 'Debes estar autenticado para crear una reseña';
      return;
    }

    // Enviar la solicitud con el token de acceso en los headers
    const headers = { 'Authorization': `Bearer ${accessToken}` };
    this.http.post(`/api/reviews`, reviewData, { headers }).subscribe({
      next: (response) => {
        console.log('Reseña creada:', response);
        alert('Reseña creada exitosamente!');
        this.resetForm();
      },
      error: (error) => {
        this.error = 'Error al crear la reseña';
        console.error('Error creating review:', error);
      }
    });
  }

  resetForm() {
    this.selectedItem = null;
    this.rating = 0;
    this.title = '';
    this.content = '';
    this.timestampMs = null;
    this.trackDurationMs = null;
    this.searchQuery = '';
    this.error = '';
  }

  formatDuration(ms: number | null): string {
    if (!ms || ms < 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  formatTimestamp(ms: number | null): string {
    return this.formatDuration(ms);
  }

  onTimestampInput(event: Event) {
    const inputValue = Number((event.target as HTMLInputElement).value);
    this.timestampMs = isNaN(inputValue) ? 0 : inputValue;
    this.onTimestampChange();
  }

  onTimestampChange() {
    // Validar que el timestamp no exceda la duración
    if (this.selectedItem?.type === 'track' && this.timestampMs !== null && this.trackDurationMs) {
      if (this.timestampMs > this.trackDurationMs) {
        this.error = `El momento exacto no puede ser mayor a la duración de la canción (${this.formatDuration(this.trackDurationMs)})`;
      } else {
        this.error = '';
      }
    }
  }

  getArtistNames(artists: { name: string }[]): string {
    return artists.map(artist => artist.name).join(', ');
  }
}