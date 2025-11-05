import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, RouterLink],

  templateUrl: './review.component.html', 
})

export class ReviewComponent { 
  
  constructor() {}
}