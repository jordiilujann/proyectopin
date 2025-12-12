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
  loadingMore: boolean = false;
  error: string = '';
  activeMenuId: string | null = null;
  currentUserId: string | null = null;
  currentUserName: string | null = null;
  selectedItemId: string = '';
  selectedItemReviews: any[] = [];
  isLoadingReviews: boolean = false;
  currentPage: number = 1;
  hasMorePages: boolean = true;
  pageSize: number = 10;
  initialLoadSize: number = 5; // Cargar solo 5 reseñas inicialmente
  pendingReviews: Review[] = []; // Reseñas pendientes de enriquecer
  getRandomTime(): string {
  const times = ['1 min', '5 min', '1h', '3h', '1d'];
  return times[Math.floor(Math.random() * times.length)];
}

  constructor(
    private reviewService: ReviewService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router // Inyección de Router
  ) {}


  goToReviewItem(review: any) {
    // 1. Si la reseña es mía, no hago nada (o podrías llevar a editar)
    if (review.user_id === this.currentUserId) return;

    // 2. Preparar el objeto con los datos limpios para el formulario
    const itemToReview = {
      id: review.spotify_id,
      name: review.item_name,
      type: review.target_type,
      coverUrl: review.item_cover_url,
      artists: review.item_artists ? review.item_artists.map((name: string) => ({ name })) : [],
      genre: review.genre
    };

    console.log('Yendo a reseñar:', itemToReview);

    // 3. Navegar pasando los datos en el estado
    this.router.navigate(['/app/reviews/create'], { 
      state: { preSelected: itemToReview } 
    });
  }


  toggleMenu(event: Event, reviewId: string) {
    event.stopPropagation();
    this.activeMenuId = this.activeMenuId === reviewId ? null : reviewId;
  }

  @HostListener('document:click')
  clickout() {
    this.activeMenuId = null;
  }

  @HostListener('window:scroll')
  onScroll(): void {
    // Detectar cuando el usuario está cerca del final de la página
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Cargar más cuando esté a 200px del final
    const threshold = 200;
    if (scrollTop + windowHeight >= documentHeight - threshold) {
      this.loadMoreReviews();
    }
  }

  ngOnInit(): void {
    this.auth.ensureUserIdentity().subscribe({
      next: () => {
        this.currentUserId = this.auth.getUserId();
        this.currentUserName = this.auth.getUserName();
        this.loadReviews();
        this.loadUserLikes();
      },
      error: () => {
        this.loadReviews();
      }
    });
  }

  loadUserLikes(): void {
    if (!this.currentUserId) return;
    
    this.reviewService.getLikedReviews(this.currentUserId).subscribe({
      next: (likedReviewIds: string[]) => {
        // Inicializar el Set con los IDs de las reseñas que el usuario ha dado like
        this.likedReviews = new Set(likedReviewIds);
        console.log('Likes del usuario cargados:', this.likedReviews);
      },
      error: (error) => {
        console.error('Error al cargar los likes del usuario:', error);
        // Si falla, inicializar con un Set vacío
        this.likedReviews = new Set();
      }
    });
  }

  loadReviews(): void {
    if (this.loading) return;

    this.loading = true;
    this.error = '';
    this.currentPage = 1;
    this.hasMorePages = true;
    this.reviews = [];
    this.pendingReviews = [];

    // Cargar primera página completa del backend
    this.reviewService.getReviews(this.currentPage, this.pageSize)
      .subscribe({
        next: (response: any) => {
          console.log('Respuesta recibida:', response);
          
          let reviewsArray: Review[] = [];
          
          // Manejar diferentes formatos de respuesta
          if (Array.isArray(response)) {
            reviewsArray = response;
            this.hasMorePages = reviewsArray.length === this.pageSize;
          } else if (response && response.reviews) {
            reviewsArray = response.reviews;
            // Verificar si hay más páginas
            if (response.totalPages !== undefined) {
              this.hasMorePages = this.currentPage < response.totalPages;
            } else {
              this.hasMorePages = reviewsArray.length === this.pageSize;
            }
          } else {
            this.error = 'Formato de respuesta inesperado';
            console.error('Formato de respuesta inesperado:', response);
            this.loading = false;
            return;
          }
          
          // Separar reseñas: las primeras para mostrar inmediatamente, el resto para cargar después
          const initialReviews = reviewsArray.slice(0, this.initialLoadSize);
          const remainingReviews = reviewsArray.slice(this.initialLoadSize);
          
          // Enriquecer y mostrar primero solo las visibles
          this.enrichReviewsWithSpotifyInfo(initialReviews, true, true);
          
          // Guardar las restantes para cargar después
          if (remainingReviews.length > 0) {
            this.pendingReviews = remainingReviews;
            // Cargar las restantes después de un breve delay
            setTimeout(() => {
              this.loadPendingReviews();
            }, 500);
          }
        },
        error: (error) => {
          this.error = 'Error al cargar las reseñas';
          this.loading = false;
          console.error('Error loading reviews:', error);
        }
      });
  }

  loadPendingReviews(): void {
    if (this.pendingReviews.length === 0) return;
    
    // Tomar las siguientes reseñas pendientes
    const reviewsToLoad = this.pendingReviews.splice(0, 3); // Cargar 3 a la vez
    
    // Enriquecer y agregar
    this.enrichReviewsWithSpotifyInfo(reviewsToLoad, false, false);
    
    // Si aún hay más pendientes, cargar más después de un delay
    if (this.pendingReviews.length > 0) {
      setTimeout(() => {
        this.loadPendingReviews();
      }, 300);
    }
  }

  loadMoreReviews(): void {
    // Evitar cargar si ya está cargando o no hay más páginas
    if (this.loadingMore || !this.hasMorePages || this.loading) return;

    this.loadingMore = true;
    this.currentPage++;

    this.reviewService.getReviews(this.currentPage, this.pageSize)
      .subscribe({
        next: (response: any) => {
          let reviewsArray: Review[] = [];
          
          if (Array.isArray(response)) {
            reviewsArray = response;
            this.hasMorePages = reviewsArray.length === this.pageSize;
          } else if (response && response.reviews) {
            reviewsArray = response.reviews;
            if (response.totalPages !== undefined) {
              this.hasMorePages = this.currentPage < response.totalPages;
            } else {
              this.hasMorePages = reviewsArray.length === this.pageSize;
            }
          }

          // Enriquecer y agregar a las reseñas existentes
          if (reviewsArray.length > 0) {
            this.enrichReviewsWithSpotifyInfo(reviewsArray, false);
          } else {
            this.hasMorePages = false;
            this.loadingMore = false;
          }
        },
        error: (error) => {
          console.error('Error loading more reviews:', error);
          this.currentPage--; // Revertir el incremento de página
          this.loadingMore = false;
        }
      });
  }

  // Método para enriquecer las reseñas con información de Spotify
  enrichReviewsWithSpotifyInfo(reviews: Review[], isInitialLoad: boolean = true, showImmediately: boolean = false): void {
    const enrichedReviews: Review[] = [];
    let processedCount = 0;

    if (reviews.length === 0) {
      if (isInitialLoad) {
        this.reviews = [];
        this.loading = false;
      } else {
        this.loadingMore = false;
      }
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
              likes: review.likes || 0,
              item_name: spotifyInfo.name || review.item_name,
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

            // Si showImmediately es true, mostrar cada reseña tan pronto como esté lista
            if (showImmediately && isInitialLoad) {
              // Agregar inmediatamente a las reseñas existentes
              const existingIndex = this.reviews.findIndex(r => r._id === enrichedReview._id);
              if (existingIndex === -1) {
                this.reviews = [...this.reviews, enrichedReview];
                this.cdr.detectChanges();
              }
            }

            // Cuando todas las reseñas han sido procesadas
            if (processedCount === reviews.length) {
              if (isInitialLoad && !showImmediately) {
                this.reviews = enrichedReviews;
                this.loading = false;
              } else if (!isInitialLoad || !showImmediately) {
                // Agregar a las reseñas existentes (evitando duplicados)
                const newReviews = enrichedReviews.filter(newReview => 
                  !this.reviews.some(existingReview => existingReview._id === newReview._id)
                );
                this.reviews = [...this.reviews, ...newReviews];
                if (!isInitialLoad) {
                  this.loadingMore = false;
                } else {
                  this.loading = false;
                }
              }
              console.log('Reviews enriquecidas con Spotify:', enrichedReviews.length);
            }
          },
          error: (error) => {
            console.error(`Error obteniendo info de Spotify para ${review.spotify_id}:`, error);
            // Usar la información básica si falla la llamada a Spotify
            const basicReview: Review = {
              ...review,
              likes: review.likes || 0
            };
            
            enrichedReviews[index] = basicReview;
            processedCount++;

            // Si showImmediately es true, mostrar inmediatamente
            if (showImmediately && isInitialLoad) {
              const existingIndex = this.reviews.findIndex(r => r._id === basicReview._id);
              if (existingIndex === -1) {
                this.reviews = [...this.reviews, basicReview];
                this.cdr.detectChanges();
              }
            }

            if (processedCount === reviews.length) {
              if (isInitialLoad && !showImmediately) {
                this.reviews = enrichedReviews;
                this.loading = false;
              } else if (!isInitialLoad || !showImmediately) {
                const newReviews = enrichedReviews.filter(newReview => 
                  !this.reviews.some(existingReview => existingReview._id === newReview._id)
                );
                this.reviews = [...this.reviews, ...newReviews];
                if (!isInitialLoad) {
                  this.loadingMore = false;
                } else {
                  this.loading = false;
                }
              }
            }
          }
        });
    });
  }

  likedReviews: Set<string> = new Set(); // Para trackear qué reseñas tiene like el usuario actual

  toggleLike(review: Review): void {
    if (!review._id || !this.currentUserId) return;

    const isLiked = this.likedReviews.has(review._id);
    const reviewIndex = this.reviews.findIndex(r => r._id === review._id);
    
    if (reviewIndex === -1) return;

    if (isLiked) {
      // Quitar like
      this.reviewService.unlikeReview(review._id).subscribe({
        next: (response) => {
          this.reviews[reviewIndex].likes = response.likes || 0;
          this.likedReviews.delete(review._id);
        },
        error: (error) => {
          console.error('Error al quitar like:', error);
        }
      });
    } else {
      // Dar like
      this.reviewService.likeReview(review._id).subscribe({
        next: (response) => {
          this.reviews[reviewIndex].likes = response.likes || 0;
          this.likedReviews.add(review._id);
        },
        error: (error) => {
          console.error('Error al dar like:', error);
        }
      });
    }
  }

  isLiked(reviewId: string | undefined): boolean {
    if (!reviewId) return false;
    return this.likedReviews.has(reviewId);
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

    getAverageRatingForItem(spotifyId: string | undefined | null): string {
    if (!spotifyId) return '-';

    const itemReviews = this.reviews.filter(
      r => r.spotify_id === spotifyId && typeof r.rating === 'number'
    );

    if (itemReviews.length === 0) return '-';

    const sum = itemReviews.reduce((acc, r) => {
      const rating = Number(r.rating) || 0;
      return acc + rating;
    }, 0);

    const avg = sum / itemReviews.length;
    return avg.toFixed(1); // ej: "3.8"
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
