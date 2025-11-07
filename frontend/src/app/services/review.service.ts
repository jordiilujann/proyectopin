import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Review, ReviewResponse, LikeReviewResponse } from '../models/review.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private readonly API_BASE = 'http://127.0.0.1:3000';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.auth.getAccessToken();
    if (!token) {
      return new HttpHeaders({
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getReviews(page: number = 1, limit: number = 5): Observable<ReviewResponse> {
    const headers = this.getHeaders();
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ReviewResponse>(`${this.API_BASE}/api/reviews`, { headers, params });
  }

  getReviewById(id: string): Observable<Review> {
    const headers = this.getHeaders();
    return this.http.get<Review>(`${this.API_BASE}/api/reviews/${id}`, { headers });
  }

  getReviewsByUser(userId: string): Observable<Review[]> {
    const headers = this.getHeaders();
    return this.http.get<Review[]>(`${this.API_BASE}/api/reviews/user/${userId}`, { headers });
  }

  likeReview(reviewId: string): Observable<LikeReviewResponse> {
    const headers = this.getHeaders();
    return this.http.post<LikeReviewResponse>(
      `${this.API_BASE}/api/reviews/${reviewId}/like`, 
      {}, 
      { headers }
    );
  }

  unlikeReview(reviewId: string): Observable<LikeReviewResponse> {
    const headers = this.getHeaders();
    return this.http.post<LikeReviewResponse>(
      `${this.API_BASE}/api/reviews/${reviewId}/unlike`, 
      {}, 
      { headers }
    );
  }

  // Método para obtener información adicional de Spotify (carátulas, nombres)
  getSpotifyItemInfo(spotifyId: string, targetType: string): Observable<any> {
    const headers = this.getHeaders();
    
    // Mapear el tipo de target a la ruta correcta de Spotify
    let endpoint = '';
    switch (targetType) {
      case 'track':
        endpoint = `tracks/${spotifyId}`;
        break;
      case 'album':
        endpoint = `albums/${spotifyId}`;
        break;
      case 'artist':
        endpoint = `artists/${spotifyId}`;
        break;
      default:
        endpoint = `tracks/${spotifyId}`; // Default to track
    }
    
    return this.http.get<any>(
      `${this.API_BASE}/api/spotify/${endpoint}`, 
      { headers }
    );
  }
}