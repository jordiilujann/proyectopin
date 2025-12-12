import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { AuthService } from '../../services/auth.service';
import { ReviewService } from '../../services/review.service';

type Tab = 'overview' | 'reviews' | 'music';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  // ---- Estado principal
  profile: any = null;
  error = '';
  loading = true;
  followersCount = 0;

  // ---- Tabs
  tab: Tab = 'overview';

  // ---- Datos backend (tus reseñas)
  reviews: any[] = [];
  selectedReviewId: string | null = null; // Para trackear qué reseña está expandida
  // Cambia si necesitas otra URL para tu backend
  private readonly API_BASE = 'http://127.0.0.1:3000';

  // ---- Datos Spotify
  topArtists: any[] = [];
  topTracks: any[] = [];
  playlists: any[] = [];
  recentlyPlayed: any[] = [];
  selectedPlaylistId: string | null = null;
  playlistTracks: { [playlistId: string]: any[] } = {};
  loadingPlaylistTracks: { [playlistId: string]: boolean } = {};

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private reviewService: ReviewService
  ) {}

  ngOnInit(): void {
    const token = this.auth.getAccessToken();
    if (!token) {
      this.loading = false;
      this.error = 'No hay sesión iniciada.';
      return;
    }

    // Perfil (viene de tu backend o directamente de Spotify vía AuthService)
    this.auth.getProfile().subscribe({
      next: (data: any) => {
        this.profile = data;
        this.error = '';

        const userId = data?.user_id ?? data?._id ?? data?.id ?? data?.spotify_id;
        const userName = data?.user_name ?? data?.display_name ?? data?.name;
        this.auth.setUserIdentity(userId, userName);

        // Dispara cargas en paralelo
        this.loadReviews();
        this.loadSpotifyBlocks();

        const currentUserId = this.auth.getUserId();
          if (currentUserId) {
          this.loadFollowersCount(currentUserId);
}
      },
      error: () => {
        this.loading = false;
        this.error = 'Sesión caducada o error al cargar perfil. Ve a Login para iniciar sesión.';
      }
    });
  }

  // -----------------------------
  // Reseñas del usuario (backend)
  // -----------------------------
  private loadReviews(): void {
    const uid = this.auth.getUserId();
    const token = this.auth.getAccessToken();
    if (!uid || !token) return;

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<any[]>(`${this.API_BASE}/api/reviews/user/${uid}`, { headers })
      .subscribe({
        next: (res) => { this.enrichReviews(res || []); },
        error: () => { this.reviews = []; }
      });
  }

  // -----------------------------
  // Seguidores en Jarana (colección follows)
  // -----------------------------
  private loadFollowersCount(userId: string): void {
  // Esta ruta usa followController.getFollowerCount
  // GET /api/follows/followers/:userId/count
    this.http
      .get<{ userId: string; followers: number }>(
        `${this.API_BASE}/api/follows/followers/${userId}/count`
      )
      .subscribe({
        next: (res) => {
          this.followersCount = res?.followers ?? 0;
          console.log('[Profile] followersCount =', this.followersCount);
        },
        error: (err) => {
          console.error('[Profile] error cargando followers', err);
          this.followersCount = 0;
        },
      });
  }


  private enrichReviews(reviews: any[]): void {
    if (!reviews.length) {
      this.reviews = [];
      return;
    }

    const enriched: any[] = [];
    let processed = 0;

    reviews.forEach((review, index) => {
      this.reviewService.getSpotifyItemInfo(review.spotify_id, review.target_type).subscribe({
        next: (info) => {
          enriched[index] = {
            ...review,
            album_image: info.coverUrl ||
              info.album?.images?.[0]?.url ||
              info.images?.[0]?.url ||
              review.album_image ||
              null,
            item_name: info.name || review.item_name || review.title,
            item_artists: info.artists ? info.artists.map((a: any) => a.name) : review.item_artists
          };
          processed++;
          if (processed === reviews.length) {
            this.reviews = enriched;
          }
        },
        error: () => {
          enriched[index] = review;
          processed++;
          if (processed === reviews.length) {
            this.reviews = enriched;
          }
        }
      });
    });
  }

  // -----------------------------
  // Bloques de música (Spotify)
  // -----------------------------
  private loadSpotifyBlocks(): void {
    const sToken = this.auth.getAccessToken();
    if (!sToken) { this.loading = false; return; }

    const S = 'https://api.spotify.com/v1';
    const H = new HttpHeaders({ Authorization: `Bearer ${sToken}` });

    // 1) Top artistas (plazo medio)
    this.http.get<any>(`${S}/me/top/artists?limit=10&time_range=medium_term`, { headers: H })
      .subscribe({ next: r => this.topArtists = r?.items || [], error: () => {} });

    // 2) Top canciones (plazo medio)
    this.http.get<any>(`${S}/me/top/tracks?limit=10&time_range=medium_term`, { headers: H })
      .subscribe({ next: r => this.topTracks = r?.items || [], error: () => {} });

    // 3) Playlists propias o seguidas
    this.http.get<any>(`${S}/me/playlists?limit=10`, { headers: H })
      .subscribe({ next: r => this.playlists = r?.items || [], error: () => {} });

    // 4) Escuchado recientemente
    this.http.get<any>(`${S}/me/player/recently-played?limit=10`, { headers: H })
      .subscribe({
        next: r => this.recentlyPlayed = (r?.items || []).map((it: any) => it.track),
        error: () => {}
      });

    // Marcamos fin de carga (no esperamos a todos para no bloquear)
    setTimeout(() => this.loading = false, 150);
  }

  setTab(t: Tab) { this.tab = t; }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => { this.profile = null; this.error = ''; },
      error: () => { this.error = 'Error al cerrar sesión'; }
    });
  }

  // Helpers UI
  primaryImage(images?: any[], size: 's'|'m'='m'): string | null {
    if (!images?.length) return null;
    // Spotify suele traer varias resoluciones: cojo la más cercana
    if (size === 's') return images[images.length - 1]?.url || images[0]?.url;
    return images[0]?.url;
  }

  artistNames(track: any): string {
    return (track?.artists || []).map((a: any) => a.name).join(', ');
  }

  toggleReviewDetails(reviewId: string): void {
    if (this.selectedReviewId === reviewId) {
      this.selectedReviewId = null; // Cerrar si ya está abierto
    } else {
      this.selectedReviewId = reviewId; // Abrir la reseña seleccionada
    }
  }

  isReviewExpanded(reviewId: string): boolean {
    return this.selectedReviewId === reviewId;
  }

  formatDuration(ms: number | null | undefined): string {
    if (!ms || ms < 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  formatArtists(artists: any): string {
    if (!artists) return '';
    if (Array.isArray(artists)) {
      return artists.join(', ');
    }
    return artists;
  }

  togglePlaylistTracks(playlistId: string): void {
    if (this.selectedPlaylistId === playlistId) {
      this.selectedPlaylistId = null; // Cerrar si ya está abierto
    } else {
      this.selectedPlaylistId = playlistId;
      // Cargar las canciones si no están cargadas
      if (!this.playlistTracks[playlistId]) {
        this.loadPlaylistTracks(playlistId);
      }
    }
  }

  isPlaylistExpanded(playlistId: string): boolean {
    return this.selectedPlaylistId === playlistId;
  }

  isLoadingPlaylist(playlistId: string): boolean {
    return this.loadingPlaylistTracks[playlistId] === true;
  }

  getPlaylistTracks(playlistId: string): any[] {
    return this.playlistTracks[playlistId] || [];
  }

  private loadPlaylistTracks(playlistId: string): void {
    const token = this.auth.getAccessToken();
    if (!token) return;

    this.loadingPlaylistTracks[playlistId] = true;
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const spotifyApi = 'https://api.spotify.com/v1';

    // Obtener las canciones de la playlist
    this.http.get<any>(`${spotifyApi}/playlists/${playlistId}/tracks?limit=50`, { headers })
      .subscribe({
        next: (response) => {
          const tracks = (response.items || []).map((item: any) => item.track).filter((track: any) => track !== null);
          this.playlistTracks[playlistId] = tracks;
          this.loadingPlaylistTracks[playlistId] = false;
        },
        error: (error) => {
          console.error('Error cargando canciones de playlist:', error);
          this.playlistTracks[playlistId] = [];
          this.loadingPlaylistTracks[playlistId] = false;
        }
      });
  }
}
