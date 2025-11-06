import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  profile: any = null;
  error: string = '';

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['access_token'] && params['refresh_token']) {
        this.authService.saveTokens(
          params['access_token'], 
          params['refresh_token'],
          params['user_id']
        );
        window.history.replaceState({}, '', '/');
        this.loadProfile();
      } else if (params['error']) {
        this.error = 'Error en la autenticación';
      } else {
        this.loadProfile();
      }
    });
  }

  login() {
    // Si ya hay token guardado, intentar cargar el perfil
    if (this.authService.getAccessToken()) {
      this.loadProfile();
      return;
    }
    // Si no hay token, redirigir a Spotify para iniciar sesión
    this.authService.login();
  }

  loadProfile() {
    const token = this.authService.getAccessToken();
    if (!token) {
      this.profile = null;
      return;
    }

    this.authService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.error = '';
      },
      error: () => {
        // Si falla, el token probablemente expiró, redirigir a login
        this.profile = null;
        this.authService.login();
      }
    });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.profile = null;
        this.error = '';
      },
      error: () => {
        this.error = 'Error al cerrar sesión';
      }
    });
  }
}

