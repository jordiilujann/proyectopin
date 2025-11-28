import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SpotifyService, SpotifyTrack, SpotifyAlbum, SpotifyArtist } from '../../services/spotify.service';
import { AuthService } from '../../services/auth.service';
import { ReviewService } from '../../services/review.service';
import { FormsModule } from '@angular/forms';

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
  successMessage: string = '';
  private searchTimeout?: ReturnType<typeof setTimeout>;
  isEditMode: boolean = false;
  reviewId: string | null = null;
  showModal: boolean = false;
  modalType: 'success' | 'confirm' = 'success'; 
  modalTitle: string = '';
  modalMessage: string = '';
  private pendingAction: () => void = () => {};

  constructor(
    private spotifyService: SpotifyService,
    private http: HttpClient,
    private authService: AuthService,
    private reviewService: ReviewService,
    private route: ActivatedRoute, 
    private router: Router
  ) {}

  ngOnInit() {
    // 1. Comprobar si venimos del Feed/Buscador con datos precargados
    const state = history.state;
    if (state && state.preSelected) {
      console.log('Recibido item preseleccionado:', state.preSelected);
      const item = state.preSelected;
      
      // Simulamos la selección del item
      this.selectedItem = {
        id: item.id,
        name: item.name,
        type: item.type,
        coverUrl: item.coverUrl,
        artists: item.artists,
        genre: item.genre
      };

      // Si es un track, intentamos obtener su duración y género
      if (item.type === 'track') {
          this.spotifyService.getTrackById(item.id).subscribe({
            next: (track) => {
                this.trackDurationMs = track.durationMs;
            },
            error: (e) => console.error('Error obteniendo duración track preseleccionado', e)
          });

          if (item.artists && item.artists.length > 0) {
             this.getArtistGenre(item.artists[0].id || item.artists[0]._id); 
          }
      } else if (item.type === 'artist' && !item.genre && item.id) {
          this.getArtistGenre(item.id);
      }
      return;
    }

    // 2. Comprobar si estamos en modo edición
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.reviewId = id;
        this.loadReviewData(id);
      }
    });
  }

  loadReviewData(id: string) {
    this.isLoading = true;
    this.reviewService.getReviewById(id).subscribe({
      next: (review: any) => {
        console.log('Datos recibidos para editar:', review);

        this.title = review.title;
        this.content = review.content;
        this.rating = review.rating || review.puntuacion;
        
        if (review.timestamp_ms) {
            this.timestampMs = review.timestamp_ms;
        }

        const spotifyId = review.spotify_id || review.spotifyId; 
        const targetType = review.target_type || review.targetType;

        // CORRECCIÓN: Recuperar info fresca de Spotify usando el ID
        this.reviewService.getSpotifyItemInfo(spotifyId, targetType).subscribe({
          next: (item: any) => {
            // Determinar URL de imagen según el tipo de respuesta de Spotify
            let coverUrl = item.coverUrl;
            if (!coverUrl && item.images && item.images.length > 0) coverUrl = item.images[0].url;
            if (!coverUrl && item.album && item.album.images && item.album.images.length > 0) coverUrl = item.album.images[0].url;

            this.selectedItem = {
               id: spotifyId,
               name: item.name, // ¡Nombre real de la canción!
               type: targetType,
               coverUrl: coverUrl,
               artists: item.artists,
               genre: item.genres ? item.genres[0] : undefined
            };

            // Si es canción, pillar duración para validar timestamp
            if (targetType === 'track') {
              this.trackDurationMs = item.duration_ms || item.durationMs;
              // Intentar pillar género si no vino directo
              if (!this.selectedItem.genre && item.artists && item.artists.length > 0) {
                this.getArtistGenre(item.artists[0].id);
              }
            }

            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error cargando info de Spotify en edición:', err);
            // Fallback si falla la API: usar datos guardados si existen o genéricos
            this.selectedItem = {
               id: spotifyId,
               name: review.item_name || 'Elemento desconocido', 
               type: targetType,
               coverUrl: review.item_cover_url
            };
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.error = "Error al cargar la reseña para editar";
        this.isLoading = false;
      }
    });
  }

  openSuccessModal(title: string, message: string, actionOnClose: () => void) {
    this.modalType = 'success';
    this.modalTitle = title;
    this.modalMessage = message;
    this.pendingAction = actionOnClose;
    this.showModal = true;
  }

  openConfirmModal(title: string, message: string, actionOnConfirm: () => void) {
    this.modalType = 'confirm';
    this.modalTitle = title;
    this.modalMessage = message;
    this.pendingAction = actionOnConfirm;
    this.showModal = true;
  }

  onModalConfirm() {
    this.pendingAction(); 
    if (this.modalType === 'confirm') {
       this.showModal = false; 
    }
  }

  closeModal() {
    this.showModal = false;
  }

  search() {
    if (!this.searchQuery.trim()) return;

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = undefined;
    }

    this.successMessage = '';
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

  onSearchInput() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.search();
    }, 400);
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
    console.log('Intentando enviar formulario...');

    // 1. Validaciones básicas
    if (!this.selectedItem || this.rating === 0) {
      console.warn('Faltan datos:', { item: this.selectedItem, rating: this.rating });
      this.error = 'Por favor selecciona un item y establece una valoración';
      return;
    }

    // 2. Validación de Timestamp
    if (this.selectedItem.type === 'track' && this.timestampMs !== null) {
      if (this.trackDurationMs && this.timestampMs > this.trackDurationMs) {
        this.error = `El momento exacto no puede ser mayor a la duración de la canción (${this.formatDuration(this.trackDurationMs)})`;
        return;
      }
    }

    // 3. Preparar datos
    const reviewData: any = {
      spotify_id: this.selectedItem.id,
      target_type: this.selectedItem.type,
      rating: this.rating,
      genre: this.selectedItem.genre || '',
      content: this.content,
      title: this.title
    };

    // Añadir timestamp si es track
    if (this.selectedItem.type === 'track') {
      const sanitizedTimestamp = this.timestampMs ?? 0;
      reviewData.timestamp_ms = Math.max(0, Math.floor(sanitizedTimestamp));
    }

    console.log('Datos a enviar:', reviewData);

    // 4. Lógica de envío
    if (this.isEditMode && this.reviewId) {
      // --- MODO EDICIÓN ---
      this.reviewService.updateReview(this.reviewId, reviewData).subscribe({
        next: (res) => {
          this.openSuccessModal(
            '¡Reseña Actualizada!', 
            'Los cambios se han guardado correctamente.', 
            () => this.router.navigate(['/app/feed'])
          );
        },
        error: (err) => this.error = 'Error al actualizar: ' + (err.error?.message || err.message)
      });
    } else {
      // --- MODO CREACIÓN ---
      const accessToken = this.authService.getAccessToken();
      if (!accessToken) {
        this.error = 'Debes estar autenticado para crear una reseña';
        return;
      }

      const headers = { 'Authorization': `Bearer ${accessToken}` };
      
      this.http.post(`/api/reviews`, reviewData, { headers }).subscribe({
        next: (response) => {
          this.openSuccessModal(
            '¡Reseña Publicada!', 
            'Tu reseña se ha creado y publicado en el muro.', 
            () => this.router.navigate(['/app/feed'])
          );
        },
        error: (error) => {
          this.error = 'Error al crear la reseña';
        }
      });
    }
  }

  deleteReview() {
    if (this.isEditMode && this.reviewId) {
      this.openConfirmModal(
        '¿Eliminar Reseña?',
        'Esta acción es irreversible. ¿Estás seguro?',
        () => {
          this.reviewService.deleteReview(this.reviewId!).subscribe({
            next: () => {
              this.showModal = false;
              this.router.navigate(['/app/feed']);
            },
            error: (err) => this.error = 'Error al eliminar'
          });
        }
      );
    }
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
    this.isEditMode = false;
    this.reviewId = null;
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
    if (!artists) return '';
    return artists.map(artist => artist.name).join(', ');
  }
}