import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router'; // <--- IMPORTANTE

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive], // <--- IMPORTANTE
  templateUrl: './navbar.component.html',
  // BORRA LA LÍNEA DE styleUrl O styleUrls AQUÍ
})
export class NavbarComponent {}