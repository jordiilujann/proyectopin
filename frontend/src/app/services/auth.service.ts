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

  // Método para verificar si el token está expirado basado en el error
  isTokenExpiredError(error: any): boolean {
    return error?.error?.code === 'TOKEN_EXPIRED' || 
           error?.error?.error?.includes('expired') ||
           error?.status === 401;
  }

  // Limpiar tokens expirados y redirigir al login
  handleExpiredToken(): void {
    this.logout().subscribe({
      next: () => {
        // Redirigir al login con mensaje de token expirado
        window.location.href = '/login?error=token_expired';
      },
      error: () => {
        // Si falla el logout, limpiar local storage y redirigir igualmente
        localStorage.removeItem(this.ACCESS_TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.USER_ID_KEY);
        window.location.href = '/login?error=token_expired';
      }
    });
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  logout(): Observable<any> {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
    return this.http.post(`${this.API_URL}/logout`, {});
  }
}
