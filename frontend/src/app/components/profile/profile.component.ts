import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['access_token'] && params['refresh_token']) {
        this.authService.saveTokens(
          params['access_token'], 
          params['refresh_token'],
          params['user_id']
        );
        // Limpiar los query params manteniendo la ruta actual
        this.router.navigate([], { 
          relativeTo: this.route, 
          queryParams: {}, 
          replaceUrl: true 
        });
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
        // Mantenerse en Profile y mostrar mensaje sin forzar login/redirect
        this.profile = null;
        this.error = 'Sesión caducada o error al cargar perfil. Ve a Login para iniciar sesión.';
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

