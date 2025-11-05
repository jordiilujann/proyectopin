import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['access_token'] && params['refresh_token']) {
        this.authService.saveTokens(params['access_token'], params['refresh_token']);
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
    this.authService.login();
  }

  loadProfile() {
    try {
      this.authService.getProfile().subscribe({
        next: (data: any) => {
          this.profile = data;
          this.error = '';
        },
        error: () => {
          this.profile = null;
        }
      });
    } catch (error) {
      this.profile = null;
    }
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

