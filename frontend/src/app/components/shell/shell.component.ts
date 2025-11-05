import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './shell.component.html',
})
export class ShellComponent {}
