import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://127.0.0.1:3000';
  private readonly ACCESS_TOKEN_KEY = 'spotify_access_token';
  private readonly REFRESH_TOKEN_KEY = 'spotify_refresh_token';
  private readonly USER_ID_KEY = 'user_id';

  constructor(private http: HttpClient) {}

  login(): void {
    window.location.href = `${this.API_URL}/login`;
  }

  saveTokens(accessToken: string, refreshToken: string, userId?: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    if (userId) {
      localStorage.setItem(this.USER_ID_KEY, userId);
    }
  }

  getUserId(): string | null {
    return localStorage.getItem(this.USER_ID_KEY);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getProfile(): Observable<any> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No access token');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.API_URL}/api/me`, { headers });
  }

  logout(): Observable<any> {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
    return this.http.post(`${this.API_URL}/logout`, {});
  }
}

