import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

import { ReviewService } from '../../services/review.service';
import { AuthService } from '../../services/auth.service';

type Tab = 'overview' | 'reviews' | 'music';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  // ---- Estado principal
  profile: any = null;
  error = '';
  loading = true;

  // ---- Tabs
  tab: Tab = 'overview';

  // ---- Datos backend (tus reseñas)
  reviews: any[] = [];

  // ---- Datos Spotify
  topArtists: any[] = [];
  topTracks: any[] = [];
  playlists: any[] = [];
  recentlyPlayed: any[] = [];

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private reviewService: ReviewService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1) Si venimos del login de Spotify con tokens en la URL
    this.route.queryParams.subscribe(params => {
      const access = params['access_token'];
      const refresh = params['refresh_token'];
      const userId = params['user_id'];

      if (access && refresh) {
        this.auth.saveTokens(access, refresh, userId);

        // Limpiar los query params
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }

      // 2) Siempre que termine esto, inicializamos el perfil
      this.initProfile();
    });
  }

  private initProfile(): void {
    const token = this.auth.getAccessToken();
    if (!token) {
      this.loading = false;
      this.error = 'No hay sesión iniciada.';
      return;
    }

    this.auth.getProfile().subscribe({
      next: (data: any) => {
        this.profile = data;
        this.error = '';

        this.loadReviews();
        this.loadSpotifyBlocks();
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
    const userId = this.auth.getUserId();

    if (!userId) {
      console.warn('[Profile] No userId disponible para cargar reseñas');
      this.reviews = [];
      return;
    }

    this.reviewService.getReviews(1, 200).subscribe({
      next: (response: any) => {
        const all: any[] = Array.isArray(response)
          ? response
          : (response?.reviews ?? []);

        const mine = all.filter((r: any) => r.user_id === userId);

        this.reviews = mine.map((r: any) => ({
          ...r,
          title: r.title || r.album_title || r.track_title || 'Reseña',
          album_image:
            r.item_cover_url ||
            r.album_image ||
            r.coverUrl ||
            r.image ||
            null,
        }));

        console.log('[Profile] userId:', userId, 'reseñas encontradas:', this.reviews.length);
      },
      error: (err) => {
        console.error('[Profile] error cargando reseñas', err);
        this.reviews = [];
      }
    });
  }

  // -----------------------------
  // Bloques de música (Spotify)
  // -----------------------------
  private loadSpotifyBlocks(): void {
    const sToken = this.auth.getAccessToken();
    if (!sToken) {
      this.loading = false;
      return;
    }

    const S = 'https://api.spotify.com/v1';
    const H = new HttpHeaders({ Authorization: `Bearer ${sToken}` });

    this.http.get<any>(`${S}/me/top/artists?limit=10&time_range=medium_term`, { headers: H })
      .subscribe({ next: r => this.topArtists = r?.items || [], error: () => {} });

    this.http.get<any>(`${S}/me/top/tracks?limit=10&time_range=medium_term`, { headers: H })
      .subscribe({ next: r => this.topTracks = r?.items || [], error: () => {} });

    this.http.get<any>(`${S}/me/playlists?limit=10`, { headers: H })
      .subscribe({ next: r => this.playlists = r?.items || [], error: () => {} });

    this.http.get<any>(`${S}/me/player/recently-played?limit=10`, { headers: H })
      .subscribe({
        next: r => this.recentlyPlayed = (r?.items || []).map((it: any) => it.track),
        error: () => {}
      });

    setTimeout(() => this.loading = false, 150);
  }

  setTab(t: Tab) { this.tab = t; }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.profile = null;
        this.error = '';
      },
      error: () => {
        this.error = 'Error al cerrar sesión';
      }
    });
  }

  primaryImage(images?: any[], size: 's' | 'm' = 'm'): string | null {
    if (!images?.length) return null;
    if (size === 's') return images[images.length - 1]?.url || images[0]?.url;
    return images[0]?.url;
  }

  artistNames(track: any): string {
    return (track?.artists || []).map((a: any) => a.name).join(', ');
  }
}
