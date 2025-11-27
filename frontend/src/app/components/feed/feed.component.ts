import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService } from '../../services/review.service';
import { Review, ReviewResponse } from '../../models/review.model';
import { AuthService } from '../../services/auth.service';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './feed.component.html',
})
export class FeedComponent implements OnInit {
  reviews: Review[] = [];
  loading: boolean = false;
  error: string = '';
  activeMenuId: string | null = null;
  currentUserId: string | null = null;
  currentUserName: string | null = null;
  selectedItemId: string = '';
  selectedItemReviews: any[] = [];
  isLoadingReviews: boolean = false;

  constructor(
    private reviewService: ReviewService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router // Inyección de Router
  ) {}

  toggleMenu(event: Event, reviewId: string) {
    event.stopPropagation();
    this.activeMenuId = this.activeMenuId === reviewId ? null : reviewId;
  }

  @HostListener('document:click')
  clickout() {
    this.activeMenuId = null;
  }

  ngOnInit(): void {
    this.auth.ensureUserIdentity().subscribe({
      next: () => {
        this.currentUserId = this.auth.getUserId();
        this.currentUserName = this.auth.getUserName();
        this.loadReviews();
      },
      error: () => {
        this.loadReviews();
      }
    });
  }

  loadReviews(): void {
    if (this.loading) return;

    this.loading = true;
    this.error = '';

    // Cargar todas las reseñas de una vez (usando un límite grande)
    this.reviewService.getReviews(1, 100)
      .subscribe({
        next: (response: any) => {
          console.log('Respuesta recibida:', response);
          
          let reviewsArray: Review[] = [];
          
          // Manejar diferentes formatos de respuesta
          if (Array.isArray(response)) {
            // El backend devuelve un array directamente
            reviewsArray = response;
            console.log('Reviews recibidas (array):', reviewsArray);
          } else if (response && response.reviews) {
            // El backend devuelve un objeto ReviewResponse
            reviewsArray = response.reviews;
            console.log('Reviews recibidas (ReviewResponse):', reviewsArray);
          } else {
            // Formato inesperado
            this.error = 'Formato de respuesta inesperado';
            console.error('Formato de respuesta inesperado:', response);
            this.loading = false;
            return;
          }
          
          // Obtener información detallada de Spotify para cada reseña
          this.enrichReviewsWithSpotifyInfo(reviewsArray);
        },
        error: (error) => {
          this.error = 'Error al cargar las reseñas';
          this.loading = false;
          console.error('Error loading reviews:', error);
        }
      });
  }

  // Método para enriquecer las reseñas con información de Spotify
  enrichReviewsWithSpotifyInfo(reviews: Review[]): void {
    const enrichedReviews: Review[] = [];
    let processedCount = 0;

    if (reviews.length === 0) {
      this.reviews = [];
      this.loading = false;
      return;
    }

    reviews.forEach((review, index) => {
      // Obtener información de Spotify para cada item
      this.reviewService.getSpotifyItemInfo(review.spotify_id, review.target_type)
        .subscribe({
          next: (spotifyInfo: any) => {
            console.log(`Info Spotify para ${review.spotify_id}:`, spotifyInfo);
            
            // Enriquecer la reseña con la información de Spotify
              const enrichedReview: Review = {
                ...review,
                item_name: spotifyInfo.name || review.item_name,
                // Usar coverUrl si está disponible, sino buscar en album.images o images
                item_cover_url: spotifyInfo.coverUrl ||
                               spotifyInfo.album?.images?.[0]?.url || 
                               spotifyInfo.images?.[0]?.url || 
                               review.item_cover_url,
                item_artists: spotifyInfo.artists ? 
                  spotifyInfo.artists.map((artist: any) => artist.name) : 
                  review.item_artists
              };

            enrichedReviews[index] = enrichedReview;
            processedCount++;

            // Cuando todas las reseñas han sido procesadas
            if (processedCount === reviews.length) {
              this.reviews = enrichedReviews;
              this.loading = false;
              console.log('Reviews enriquecidas con Spotify:', this.reviews);
            }
          },
          error: (error) => {
            console.error(`Error obteniendo info de Spotify para ${review.spotify_id}:`, error);
            // Usar la información básica si falla la llamada a Spotify
            enrichedReviews[index] = review;
            processedCount++;

            if (processedCount === reviews.length) {
              this.reviews = enrichedReviews;
              this.loading = false;
            }
          }
        });
    });
  }

  likeReview(review: Review): void {
    if (!review._id) return;

    this.reviewService.likeReview(review._id).subscribe({
      next: (response) => {
        // Actualizar el contador de likes en la reseña
        const index = this.reviews.findIndex(r => r._id === review._id);
        if (index !== -1) {
          this.reviews[index].likes = response.likes;
        }
      },
      error: (error) => {
        console.error('Error al dar like:', error);
        this.error = 'Error al dar like a la reseña';
      }
    });
  }

  getStarRating(rating: number): string[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? '★' : '☆');
    }
    return stars;
  }

  getItemTypeIcon(type: string): string {
    switch (type) {
      case 'track': return '🎵';
      case 'album': return '💿';
      case 'artist': return '👤';
      case 'playlist': return '🎼';
      default: return '📝';
    }
  }

  formatDuration(ms: number | null | undefined): string {
    if (!ms || ms < 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  viewItemReviews(spotifyId: string, targetType: string) {
    if (this.selectedItemId === spotifyId) {
      this.selectedItemId = '';
      this.selectedItemReviews = [];
      return;
    }

    this.selectedItemId = spotifyId;
    this.isLoadingReviews = true;

    // Convertimos el targetType genérico a uno válido si hace falta, o lo pasamos directo
    this.reviewService.getReviewsBySpotifyId(spotifyId, targetType).subscribe({
      next: (reviews) => {
        this.selectedItemReviews = reviews;
        this.isLoadingReviews = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando reseñas extra', err);
        this.isLoadingReviews = false;
      }
    });
  }

  goToCreateReview(review: Review) {
    const itemToPass = {
      id: review.spotify_id,
      name: review.item_name,
      type: review.target_type,
      coverUrl: review.item_cover_url,
      artists: review.item_artists?.map(name => ({ name })) || [],
      genre: review.genre 
    };

    this.router.navigate(['/app/review'], { 
      state: { preSelected: itemToPass } 
    });
  }

  // NUEVO: Método para verificar si el usuario ya ha reseñado
  hasUserReviewed(reviews: any[]): boolean {
    if (!this.currentUserId) return false;
    return reviews.some(r => r.user_id === this.currentUserId);
  }
}
