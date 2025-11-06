import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // Incluso si falla el logout en el backend, limpiamos el frontend
        this.router.navigate(['/login']);
      }
    });
  }
}
