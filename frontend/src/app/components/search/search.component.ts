import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../services/review.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: { id: string; name: string };
  coverUrl: string;
  previewUrl: string;
  popularity: number;
  externalUrl: string;
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
  spotifyResults: SpotifyTrack[] = [];
  userResults: User[] = [];
  isLoading: boolean = false;
  error: string = '';
  selectedItemReviews: any[] = []; 
  selectedItemId: string = '';
  currentUserId: string | null = null;
  isFollowing: { [userId: string]: boolean } = {};

  constructor(
    private http: HttpClient, 
    private cdr: ChangeDetectorRef,
    private reviewService: ReviewService,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit() {
    // Inicializar usuario actual para saber cuáles son sus reseñas
    this.auth.ensureUserIdentity().subscribe(() => {
      this.currentUserId = this.auth.getUserId();
    });
  }

  search() {
    if (!this.searchQuery.trim()) return;

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
    this.http.get<any[]>(`/api/spotify/tracks?q=${encodeURIComponent(this.searchQuery)}`)
      .subscribe({
        next: (results) => {
          this.spotifyResults = results;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.error = 'Error al buscar canciones';
          this.isLoading = false;
          console.error('Error searching Spotify:', error);
        }
      });
  }

  searchUsers() {
    this.http.get<any[]>(`/api/users?name=${encodeURIComponent(this.searchQuery)}`)
      .subscribe({
        next: (results) => {
          // Por ahora todos como "no seguidos" (para testear follow/unfollow)
          this.userResults = results.map(u => ({
            ...u,
            isFollowing: false
          }));
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Error al buscar usuarios';
          this.isLoading = false;
          console.error('Error searching users:', error);
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
  }

  getArtistNames(artists: { name: string }[]): string {
    return artists.map(artist => artist.name).join(', ');
  }

  viewReviews(spotifyId: string, name: string, type: 'track' | 'artist' | 'album') {
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

  goToCreateReview(item: any, type: 'track' | 'artist' | 'album') {
    // Preparamos el objeto tal como lo espera el ReviewComponent
    const itemToPass = {
      id: item.id,
      name: item.name,
      type: type,
      coverUrl: item.coverUrl,
      artists: item.artists, // Importante para buscar el género luego
      genres: item.genres 
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