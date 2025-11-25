import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  isProcessing = false;
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Capturar los tokens si volvemos del callback de Spotify
    this.route.queryParams.subscribe(params => {
      const accessToken = params['access_token'];
      const refreshToken = params['refresh_token'];
      const error = params['error'];
      const tokenExpired = params['token_expired'];
      const userId = params['user_id'];
      const userName = params['user_name'];

      if (error) {
        this.errorMessage = 'Error en la autenticación. Por favor, intenta de nuevo.';
        console.error('Error en autenticación:', error);
        return;
      }

      if (tokenExpired) {
        this.errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        return;
      }

      if (accessToken && refreshToken) {
        this.isProcessing = true;
        
        // Guardar tokens en localStorage
        this.authService.saveTokens(accessToken, refreshToken, userId, userName);
        
        // Redirigir al feed
        this.router.navigate(['/app/feed']);
      }
    });
  }

  onLoginClicked() {
    this.isProcessing = true;
    this.errorMessage = null;
    
    //pal commit
    // Redirigir a la URL de login de Spotify en el backend
    this.authService.login();
  }
}
