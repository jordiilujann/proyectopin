import { Component, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../services/review.service';

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
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
})
export class SearchComponent {
  searchQuery: string = '';
  activeTab: 'spotify' | 'users' = 'spotify';
  spotifyResults: SpotifyTrack[] = [];
  userResults: User[] = [];
  isLoading: boolean = false;
  error: string = '';
  selectedItemReviews: any[] = []; 
  selectedItemName: string = '';

  constructor(
    private http: HttpClient, 
    private cdr: ChangeDetectorRef,
    private reviewService: ReviewService
  ) {}

  search() {
    if (!this.searchQuery.trim()) return;

    this.isLoading = true;
    this.error = '';

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
          this.userResults = results;
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Error al buscar usuarios';
          this.isLoading = false;
          console.error('Error searching users:', error);
        }
      });
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
    this.selectedItemName = name;
    this.isLoading = true;
    
    this.reviewService.getReviewsBySpotifyId(spotifyId, type).subscribe({
      next: (reviews) => {
        this.selectedItemReviews = reviews;
        this.isLoading = false;
        console.log(`Reseñas encontradas para ${name}:`, reviews);
        // Aquí podrías abrir un modal o navegar a una página de detalles
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error obteniendo reseñas', err);
        this.isLoading = false;
      }
    });
  }
}
