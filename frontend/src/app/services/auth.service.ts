import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://127.0.0.1:3000';
  private readonly ACCESS_TOKEN_KEY = 'spotify_access_token';
  private readonly REFRESH_TOKEN_KEY = 'spotify_refresh_token';
  private readonly USER_ID_KEY = 'user_id';
  private readonly USER_NAME_KEY = 'user_name';

  constructor(private http: HttpClient) {}

  login(): void {
    window.location.href = `${this.API_URL}/login`;
  }

  saveTokens(accessToken: string, refreshToken: string, userId?: string, userName?: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    if (userId) {
      localStorage.setItem(this.USER_ID_KEY, userId);
    }
    if (userName) {
      localStorage.setItem(this.USER_NAME_KEY, userName);
    }
  }

  getUserId(): string | null {
    return localStorage.getItem(this.USER_ID_KEY);
  }

  getUserName(): string | null {
    return localStorage.getItem(this.USER_NAME_KEY);
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

    return this.http.get(`${this.API_URL}/api/me`, { headers }).pipe(
      catchError((error) => {
        if (this.isTokenExpiredError(error)) {
          return this.refreshAccessToken().pipe(
            switchMap((response: any) => {
              this.saveTokens(response.access_token, response.refresh_token, response.user_id, this.getUserName() || undefined);
              const newHeaders = new HttpHeaders({
                'Authorization': `Bearer ${response.access_token}`
              });
              return this.http.get(`${this.API_URL}/api/me`, { headers: newHeaders });
            }),
            catchError((refreshError) => {
              this.handleExpiredToken();
              return throwError(() => refreshError);
            })
          );
        }
        return throwError(() => error);
      })
    );
  }

  // Método para refrescar el token de acceso usando el refresh token
  refreshAccessToken(): Observable<any> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.http.post(`${this.API_URL}/api/auth/refresh`, {
      refresh_token: refreshToken
    });
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
        localStorage.removeItem(this.USER_NAME_KEY);
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
    localStorage.removeItem(this.USER_NAME_KEY);
    return this.http.post(`${this.API_URL}/logout`, {});
  }
}
