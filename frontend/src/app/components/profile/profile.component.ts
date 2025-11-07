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

  // ---- Tus reseñas
  reviews: any[] = [];

  // ---- Datos Spotify (overview / música)
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

  // -----------------------------
  // INIT
  // -----------------------------
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const access = params['access_token'];
      const refresh = params['refresh_token'];
      const userId = params['user_id'];

      if (access && refresh) {
        this.auth.saveTokens(access, refresh, userId);

        // limpiamos la URL
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }

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
  // TUS RESEÑAS (con info Spotify)
  // -----------------------------
    // -----------------------------
  // TUS RESEÑAS (igual estilo que feed)
  // -----------------------------
  private loadReviews(): void {
    const userId = this.auth.getUserId();

    if (!userId) {
      console.warn('[Profile] No userId disponible para cargar reseñas');
      this.reviews = [];
      return;
    }

    // Usamos la ruta específica /api/reviews/user/:userId
    this.reviewService.getReviewsByUser(userId).subscribe({
      next: (userReviews: any[]) => {
        if (!userReviews || !userReviews.length) {
          this.reviews = [];
          console.log('[Profile] userId:', userId, 'sin reseñas');
          return;
        }

        const enriched: any[] = new Array(userReviews.length);
        let done = 0;

        userReviews.forEach((review, index) => {
          this.reviewService
            .getSpotifyItemInfo(review.spotify_id, review.target_type)
            .subscribe({
              next: (spotifyInfo: any) => {
                const itemName =
                  spotifyInfo?.name ||
                  review.item_name ||
                  review.title ||
                  review.spotify_id;

                const cover =
                  spotifyInfo?.coverUrl ||
                  spotifyInfo?.album?.images?.[0]?.url ||
                  spotifyInfo?.images?.[0]?.url ||
                  review.item_cover_url ||
                  null;

                const artists = spotifyInfo?.artists
                  ? spotifyInfo.artists.map((a: any) => a.name)
                  : review.item_artists || [];

                enriched[index] = {
                  ...review,
                  item_name: itemName,
                  item_cover_url: cover,
                  item_artists: artists,
                  // campos que usa el HTML
                  title: review.title || itemName,
                };

                done++;
                if (done === userReviews.length) {
                  this.reviews = enriched;
                  console.log(
                    '[Profile] userId:',
                    userId,
                    'reseñas encontradas:',
                    this.reviews.length
                  );
                }
              },
              error: () => {
                // Si falla Spotify, al menos mostramos lo que tenemos
                enriched[index] = {
                  ...review,
                  item_name: review.title || review.spotify_id,
                  item_cover_url: review.item_cover_url || null,
                  item_artists: review.item_artists || [],
                  title: review.title || review.spotify_id,
                };

                done++;
                if (done === userReviews.length) {
                  this.reviews = enriched;
                  console.log(
                    '[Profile] userId:',
                    userId,
                    'reseñas encontradas (sin enriquecer en alguna):',
                    this.reviews.length
                  );
                }
              }
            });
        });
      },
      error: (err) => {
        console.error('[Profile] error cargando reseñas', err);
        this.reviews = [];
      }
    });
  }
  getStarRating(rating: number): string[] {
    const stars: string[] = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? '★' : '☆');
    }
    return stars;
  }

    // -------- UI helpers (header) --------
  get avatarUrl(): string | null {
    // Prioriza avatar propio si existe en tu modelo de usuario
    if (this.profile?.avatar_url) {
      return this.profile.avatar_url;
    }
    // Si no, usa la foto de Spotify
    if (this.profile?.images?.length) {
      return this.primaryImage(this.profile.images);
    }
    return null;
  }

  get displayName(): string {
    return (
      this.profile?.display_name ||
      this.profile?.name ||
      'Usuario Spotify'
    );
  }

  get followerCount(): number {
    return this.profile?.followers?.total || 0;
  }



  // -----------------------------
  // BLOQUES MÚSICA (pueden fallar 403 si faltan scopes; no rompen nada)
  // -----------------------------
  private loadSpotifyBlocks(): void {
    const sToken = this.auth.getAccessToken();
    if (!sToken) {
      this.loading = false;
      return;
    }

    const S = 'https://api.spotify.com/v1';
    const H = new HttpHeaders({ Authorization: `Bearer ${sToken}` });

    this.http
      .get<any>(
        `${S}/me/top/artists?limit=10&time_range=medium_term`,
        { headers: H }
      )
      .subscribe({
        next: (r) => (this.topArtists = r?.items || []),
        error: () => {}
      });

    this.http
      .get<any>(
        `${S}/me/top/tracks?limit=10&time_range=medium_term`,
        { headers: H }
      )
      .subscribe({
        next: (r) => (this.topTracks = r?.items || []),
        error: () => {}
      });

    this.http
      .get<any>(`${S}/me/playlists?limit=10`, { headers: H })
      .subscribe({
        next: (r) => (this.playlists = r?.items || []),
        error: () => {}
      });

    this.http
      .get<any>(
        `${S}/me/player/recently-played?limit=10`,
        { headers: H }
      )
      .subscribe({
        next: (r) =>
          (this.recentlyPlayed = (r?.items || []).map((it: any) => it.track)),
        error: () => {}
      });

    setTimeout(() => (this.loading = false), 150);
  }

  // -----------------------------
  // UI helpers
  // -----------------------------
  setTab(t: Tab) {
    this.tab = t;
  }

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
