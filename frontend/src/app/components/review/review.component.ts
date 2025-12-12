import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

// Servicios
import { SpotifyService, SpotifyTrack, SpotifyAlbum, SpotifyArtist } from '../../services/spotify.service';
import { AuthService } from '../../services/auth.service';
import { ReviewService } from '../../services/review.service';

// Librería de color
import ColorThief from 'colorthief';

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
  year?: string;
}

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './review.component.html',
})
export class ReviewComponent implements OnInit, OnDestroy {
  // --- REFERENCIAS AL DOM ---
  @ViewChild('starContainer') starContainer!: ElementRef<HTMLElement>;

  // --- ESTADO BÚSQUEDA ---
  searchQuery: string = '';
  searchResults: SearchResult = { tracks: [], albums: [], artists: [] };
  isLoading: boolean = false;
  private searchTimeout?: ReturnType<typeof setTimeout>;

  // --- ESTADO FORMULARIO ---
  selectedItem: SelectedItem | null = null;
  rating: number = 0;
  title: string = '';
  content: string = '';
  timestampMs: number | null = null;
  trackDurationMs: number | null = null;
  
  // --- ESTADO UI / SISTEMA ---
  error: string = '';
  isEditMode: boolean = false;
  reviewId: string | null = null;
  currentGradient = 'linear-gradient(to bottom, #451a1a, #1a1a1a, #000000)';

  // --- ESTADO MODAL ---
  showModal: boolean = false;
  modalType: 'success' | 'confirm' = 'success'; 
  modalTitle: string = '';
  modalMessage: string = '';
  private pendingAction: () => void = () => {};

  // --- ESTADO ARRASTRE ESTRELLAS ---
  isDragging: boolean = false;

  constructor(
    private spotifyService: SpotifyService,
    private http: HttpClient,
    private authService: AuthService,
    private reviewService: ReviewService,
    private route: ActivatedRoute, 
    private router: Router
  ) {}

  ngOnInit() {
    // 1. Datos precargados desde Feed
    const state = history.state;
    if (state && state.preSelected) {
      this.selectItem(state.preSelected, state.preSelected.type);
      return; 
    }

    // 2. Modo Edición
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.reviewId = id;
        this.loadReviewData(id);
      }
    });
  }

  // ==========================================
  // LÓGICA DE CARGA Y BÚSQUEDA
  // ==========================================

  loadReviewData(id: string) {
    this.isLoading = true;
    this.reviewService.getReviewById(id).subscribe({
      next: (review: any) => {
        this.title = review.title;
        this.content = review.content;
        this.rating = review.rating;
        this.timestampMs = review.timestamp_ms || null;

        const spotifyId = review.spotify_id; 
        const targetType = review.target_type;

        this.reviewService.getSpotifyItemInfo(spotifyId, targetType).subscribe({
          next: (item: any) => {
            let coverUrl = item.coverUrl || item.images?.[0]?.url || item.album?.images?.[0]?.url;
            
            this.selectItem({
              id: spotifyId,
              name: item.name,
              type: targetType,
              coverUrl: coverUrl,
              artists: item.artists,
              genre: item.genres?.[0],
              release_date: item.release_date || item.album?.release_date
            }, targetType); 

            this.isLoading = false;
          },
          error: () => {
            this.selectedItem = {
               id: spotifyId,
               name: review.item_name,
               type: targetType,
               coverUrl: review.item_cover_url
            };
            this.extractDominantColor(review.item_cover_url);
            this.isLoading = false;
          }
        });
      },
      error: () => {
        this.error = "Error al cargar la reseña";
        this.isLoading = false;
      }
    });
  }

  search() {
    if (!this.searchQuery.trim()) return;
    if (this.searchTimeout) clearTimeout(this.searchTimeout);

    this.isLoading = true;
    this.error = '';

    this.spotifyService.searchAll(this.searchQuery).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Error al buscar contenido';
        this.isLoading = false;
      }
    });
  }

  onSearchInput() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.search(), 400);
  }

  // ==========================================
  // LÓGICA DE SELECCIÓN Y COLOR
  // ==========================================

  selectItem(item: any, type: 'track' | 'album' | 'artist') {
    let coverUrl = item.coverUrl;
    if (!coverUrl && item.images?.length) coverUrl = item.images[0].url;
    if (!coverUrl && item.album?.images?.length) coverUrl = item.album.images[0].url;

    let year = '';
    const date = item.release_date || item.album?.release_date;
    if (date) year = date.split('-')[0];

    this.selectedItem = {
      id: item.id,
      name: item.name,
      type: type,
      coverUrl: coverUrl,
      year: year,
      artists: item.artists,
      genre: item.genre
    };

    if (type === 'track') {
      this.trackDurationMs = item.duration_ms || item.durationMs || null;
      if (!this.trackDurationMs) {
         this.spotifyService.getTrackById(item.id).subscribe(t => this.trackDurationMs = t.durationMs);
      }
      if (!this.selectedItem.genre && item.artists?.length) {
        this.getArtistGenre(item.artists[0].id);
      }
    } else if (type === 'artist' && item.genres?.length) {
       this.selectedItem.genre = item.genres[0];
    }

    this.searchResults = { tracks: [], albums: [], artists: [] };
    this.searchQuery = '';
    
    if (coverUrl) {
      this.extractDominantColor(coverUrl);
    } else {
      this.resetGradient();
    }
  }

  getArtistGenre(artistId: string) {
    this.spotifyService.getArtistById(artistId).subscribe(a => {
      if (a.genres?.length && this.selectedItem) this.selectedItem.genre = a.genres[0];
    });
  }

  extractDominantColor(imageUrl: string) {
    const colorThief = new ColorThief();
    const img = new Image();
    img.crossOrigin = 'Anonymous'; 
    img.src = imageUrl;

    img.onload = () => {
      try {
        const color = colorThief.getColor(img);
        const rgbColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        this.currentGradient = `linear-gradient(to bottom, ${rgbColor}, #1a1a1a, #000000)`;
      } catch (e) {
        this.resetGradient();
      }
    };
    img.onerror = () => this.resetGradient();
  }

  resetGradient() {
    this.currentGradient = 'linear-gradient(to bottom, #451a1a, #1a1a1a, #000000)';
  }

  // ==========================================
  // LÓGICA DE ESTRELLAS (UNIFICADA & DESLIZANTE)
  // ==========================================

  setRating(value: number) {
    this.rating = Math.max(0, Math.min(5, Math.round(value * 2) / 2));
  }

  // Inicio (Click o Toque)
  onStarStart(event: MouseEvent | TouchEvent) {
    this.isDragging = true;
    this.calculateRating(event);
  }

  // Movimiento (Ratón o Dedo)
  onStarMove(event: MouseEvent | TouchEvent) {
    if (this.isDragging) {
      // PREVENIR SCROLL Y NAVEGACIÓN ATRÁS
      if (event.cancelable) {
        event.preventDefault();
      }
      this.calculateRating(event);
    }
  }

  // Fin (Soltar)
  onStarEnd() {
    this.isDragging = false;
  }

  // Cálculo Matemático
  private calculateRating(event: MouseEvent | TouchEvent) {
    if (!this.starContainer) return;

    let clientX;
    if (event instanceof MouseEvent) {
      clientX = event.clientX;
    } else if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
    } else {
      return;
    }

    const rect = this.starContainer.nativeElement.getBoundingClientRect();
    const width = rect.width;
    
    // Posición X relativa al contenedor
    let x = clientX - rect.left;

    // Limites
    if (x < 0) x = 0;
    if (x > width) x = width;

    // 0 a 5
    const rawScore = (x / width) * 5;
    // Redondeo a .5
    this.rating = Math.max(0, Math.min(5, Math.ceil(rawScore * 2) / 2));
  }

  ngOnDestroy() {
    this.isDragging = false;
  }

  // ==========================================
  // ENVÍO Y UTILIDADES
  // ==========================================

  submitReview() {
    if (!this.selectedItem || this.rating === 0) return;

    const data: any = {
      spotify_id: this.selectedItem.id,
      target_type: this.selectedItem.type,
      rating: this.rating,
      genre: this.selectedItem.genre || '',
      content: this.content,
      title: this.title,
      item_name: this.selectedItem.name, 
      item_cover_url: this.selectedItem.coverUrl
    };

    if (this.selectedItem.type === 'track') {
      data.timestamp_ms = Math.floor(this.timestampMs || 0);
    }

    if (this.isEditMode && this.reviewId) {
      this.reviewService.updateReview(this.reviewId, data).subscribe({
        next: () => this.openSuccessModal('¡Actualizado!', 'Tu reseña se ha guardado.', () => this.router.navigate(['/app/feed'])),
        error: () => this.error = 'Error al actualizar'
      });
    } else {
      const token = this.authService.getAccessToken();
      const headers = { 'Authorization': `Bearer ${token}` };
      this.http.post(`/api/reviews`, data, { headers }).subscribe({
        next: () => this.openSuccessModal('¡Publicado!', 'Tu reseña está en el muro.', () => this.router.navigate(['/app/feed'])),
        error: () => this.error = 'Error al publicar'
      });
    }
  }

  deleteReview() {
    if (this.isEditMode && this.reviewId) {
      this.openConfirmModal('¿Eliminar?', 'No podrás deshacerlo.', () => {
        this.reviewService.deleteReview(this.reviewId!).subscribe({
          next: () => { this.showModal = false; this.router.navigate(['/app/feed']); }
        });
      });
    }
  }

  // Modales
  openSuccessModal(t: string, m: string, cb: () => void) {
    this.modalType = 'success'; this.modalTitle = t; this.modalMessage = m; this.pendingAction = cb; this.showModal = true;
  }
  openConfirmModal(t: string, m: string, cb: () => void) {
    this.modalType = 'confirm'; this.modalTitle = t; this.modalMessage = m; this.pendingAction = cb; this.showModal = true;
  }
  onModalConfirm() { this.pendingAction(); if (this.modalType === 'confirm') this.showModal = false; }
  closeModal() { this.showModal = false; }

  // Utils
  formatTimestamp(ms: number | null): string {
    if (!ms || ms < 0) return '0:00';
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }
  
  onTimestampInput(e: Event) { this.timestampMs = Number((e.target as HTMLInputElement).value); }
  
  getArtistNames(artists?: { name: string }[]): string {
    return artists ? artists.map(a => a.name).join(', ') : '';
  }
}