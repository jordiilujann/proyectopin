import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../services/review.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SpotifyService, SpotifyTrack, SpotifyAlbum, SpotifyArtist } from '../../services/spotify.service';

interface SearchResult {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  coverUrl: string;
  type: 'track' | 'album' | 'artist';
  album?: { id: string; name: string };
  genres?: string[];
}

interface User {
  _id: string;
  name: string;
  email: string;
  spotify_id: string;
  country: string;
  premium: boolean;
  isFollowing?: boolean;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
})
export class SearchComponent implements OnInit {
  searchQuery: string = '';
  activeTab: 'spotify' | 'users' = 'spotify';
  spotifyResults: SearchResult[] = [];
  userResults: User[] = [];
  isLoading: boolean = false;
  error: string = '';
  selectedItemReviews: any[] = []; 
  selectedItemId: string = '';
  currentUserId: string | null = null;
  isFollowing: { [userId: string]: boolean } = {};
  private searchTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private http: HttpClient, 
    private cdr: ChangeDetectorRef,
    private reviewService: ReviewService,
    private router: Router,
    private auth: AuthService,
    private spotifyService: SpotifyService
  ) {}

  ngOnInit() {
    // Inicializar usuario actual para saber cuáles son sus reseñas
    this.auth.ensureUserIdentity().subscribe(() => {
      this.currentUserId = this.auth.getUserId();
    });
  }

  onSearchInput() {
    // Limpiar timeout anterior si existe
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Si el campo está vacío, limpiar resultados
    if (!this.searchQuery.trim()) {
      this.spotifyResults = [];
      this.userResults = [];
      this.error = '';
      this.selectedItemId = '';
      this.selectedItemReviews = [];
      return;
    }

    // Debounce: esperar 400ms después de que el usuario deje de escribir
    this.searchTimeout = setTimeout(() => {
      this.search();
    }, 400);
  }

  search() {
    if (!this.searchQuery.trim()) {
      this.spotifyResults = [];
      this.userResults = [];
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.selectedItemId = '';
    this.selectedItemReviews = [];

    if (this.activeTab === 'spotify') {
      this.searchSpotify();
    } else {
      this.searchUsers();
    }
  }

  searchSpotify() {
    this.spotifyService.searchAll(this.searchQuery).subscribe({
      next: (results) => {
        // Combinar tracks, albums y artists en un solo array con tipo
        const combinedResults: SearchResult[] = [
          ...results.tracks.map(track => ({
            id: track.id,
            name: track.name,
            artists: track.artists,
            coverUrl: track.coverUrl || '',
            type: 'track' as const,
            album: track.album
          })),
          ...results.albums.map(album => ({
            id: album.id,
            name: album.name,
            artists: album.artists,
            coverUrl: album.coverUrl || '',
            type: 'album' as const
          })),
          ...results.artists.map(artist => ({
            id: artist.id,
            name: artist.name,
            artists: [{ id: artist.id, name: artist.name }],
            coverUrl: artist.images && artist.images.length > 0 ? artist.images[0].url : '',
            type: 'artist' as const,
            genres: artist.genres || []
          }))
        ];
        
        this.spotifyResults = combinedResults;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.error = 'Error al buscar música';
        this.isLoading = false;
        console.error('Error searching Spotify:', error);
      }
    });
  }

  searchUsers() {
  this.http.get<User[]>(`/api/users?name=${encodeURIComponent(this.searchQuery)}`)
    .subscribe({
      next: (results) => {
        // Filtrar el usuario actual de los resultados
        const filteredResults = results.filter(u => {
          const currentUserId = this.auth.getUserId();
          return u._id !== currentUserId;
        });

        // Cargamos la lista de usuarios encontrados (sin el usuario actual)
        this.userResults = filteredResults.map(u => ({
          ...u,
          isFollowing: false   // valor por defecto
        }));
        this.isLoading = false;

        // Después preguntamos al backend a quién sigue el usuario actual
        this.updateFollowingFromBackend();
      },
      error: (error) => {
        this.error = 'Error al buscar usuarios';
        this.isLoading = false;
        console.error('Error searching users:', error);
      }
    });
}
  private updateFollowingFromBackend() {
  const currentUserId = this.auth.getUserId();

  // Si no hay usuario logueado o no hay resultados, no hacemos nada
  if (!currentUserId || !this.userResults.length) {
    return;
  }

  // Este endpoint YA lo tienes en el backend:
  // GET /api/follows/following/:userId  -> devuelve la lista de usuarios que sigo
  this.http.get<User[]>(`/api/follows/following/${currentUserId}`)
    .subscribe({
      next: (followingUsers) => {
        const followingSet = new Set(followingUsers.map(u => u._id));

        // Marcamos en los resultados si ya lo seguimos
        this.userResults = this.userResults.map(user => ({
          ...user,
          isFollowing: followingSet.has(user._id)
        }));
      },
      error: (err) => {
        console.error('[Search] Error al cargar usuarios seguidos', err);
      }
    });
}


  toggleFollow(user: User) {
    if (!user._id) return;

    // 1) Sacamos el token de Spotify que guardaste al hacer login
    const accessToken = this.auth.getAccessToken();
    if (!accessToken) {
      console.warn('[Search] No hay accessToken de Spotify; haz login de nuevo.');
      return;
    }

    const url = '/api/follows';
    const body = { targetUserId: user._id };

    // 2) Header tal y como lo exige spotifyAuthMiddleware
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    });

    console.log('[Search] toggleFollow para', user.name, 'isFollowing =', user.isFollowing);

    if (user.isFollowing) {
      // UNFOLLOW
      this.http.delete(url, { body, headers }).subscribe({
        next: (res) => {
          console.log('[Search] Unfollow OK', res);
          user.isFollowing = false;
        },
        error: (err) => {
          console.error('[Search] Error al dejar de seguir', err);
        }
      });
    } else {
      // FOLLOW
      this.http.post(url, body, { headers }).subscribe({
        next: (res) => {
          console.log('[Search] Follow OK', res);
          user.isFollowing = true;
        },
        error: (err) => {
          console.error('[Search] Error al seguir', err);
        }
      });
    }
  }

  setActiveTab(tab: 'spotify' | 'users') {
    this.activeTab = tab;
    this.spotifyResults = [];
    this.userResults = [];
    this.error = '';
    this.selectedItemId = '';
    this.selectedItemReviews = [];
    
    // Si hay una búsqueda activa, buscar automáticamente en la nueva pestaña
    if (this.searchQuery.trim()) {
      this.search();
    }
  }

  getArtistNames(artists: { name: string }[]): string {
    return artists.map(artist => artist.name).join(', ');
  }

  getAverageRating(reviews: any[]): string {
    if (!reviews || reviews.length === 0) {
      return '-'; // sin reseñas
    }

    const sum = reviews.reduce((acc, r) => {
      const rating = Number(r.rating) || 0;
      return acc + rating;
    }, 0);

    const avg = sum / reviews.length;
    return avg.toFixed(1); // ej: "4.3"
  }

  viewReviews(spotifyId: string, name: string, type: 'track' | 'album' | 'artist') {
    // Usamos el ID para comparar, que es único
    if (this.selectedItemId === spotifyId) {
      this.selectedItemId = ''; // Cerrar si ya está abierto
      this.selectedItemReviews = [];
      return;
    }

    this.selectedItemId = spotifyId; // Guardamos el ID, no el nombre
    this.isLoading = true;
    
    this.reviewService.getReviewsBySpotifyId(spotifyId, type).subscribe({
      next: (reviews) => {
        this.selectedItemReviews = reviews;
        this.isLoading = false;
        console.log(`Reseñas encontradas para ${name}:`, reviews);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error obteniendo reseñas', err);
        this.isLoading = false;
      }
    });
  }

  goToCreateReview(item: any, type: 'track' | 'album' | 'artist') {
    // Preparamos el objeto tal como lo espera el ReviewComponent
    let coverUrl = item.coverUrl;
    
    // Para artistas, obtener coverUrl de images si está disponible
    if (type === 'artist' && item.images && item.images.length > 0) {
      coverUrl = item.images[0].url;
    }
    
    const itemToPass = {
      id: item.id,
      name: item.name,
      type: type,
      coverUrl: coverUrl,
      artists: item.artists || [{ id: item.id, name: item.name }], // Para artistas, crear array con el propio artista
      genres: item.genres || []
    };

    // Navegamos a la ruta '/app/review' pasando el objeto en el 'state'
    this.router.navigate(['/app/review'], { 
      state: { preSelected: itemToPass } 
    });
  }

  // --- FUNCIONES NUEVAS ---

  // Comprobar si el usuario actual ya ha hecho una reseña en esta lista
  hasUserReviewed(reviews: any[]): boolean {
    if (!this.currentUserId) return false;
    return reviews.some(r => r.user_id === this.currentUserId);
  }

  // Ir a editar la reseña propia
  editReview(reviews: any[]) {
    const myReview = reviews.find(r => r.user_id === this.currentUserId);
    if (myReview) {
      // Navegar a la pantalla de review pero pasando el ID para activar modo edición
      this.router.navigate(['/app/review', { id: myReview._id }]);
    }
  }
}