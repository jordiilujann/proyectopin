import { Routes } from '@angular/router';
import { ProfileComponent } from './components/profile.component';

export const routes: Routes = [
  { path: '', component: ProfileComponent },
  { path: '**', redirectTo: '' }
];
