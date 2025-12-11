import { Routes } from '@angular/router';

import { LoginComponent }   from './components/login/login.component';
import { ShellComponent }   from './components/shell/shell.component';
import { FeedComponent }    from './components/feed/feed.component';
import { SearchComponent }  from './components/search/search.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ReviewComponent }  from './components/review/review.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { authGuard, loginGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [loginGuard] // Si ya está autenticado, redirige al feed
  },

  {
    path: 'app',
    component: ShellComponent,
    canActivate: [authGuard], // Proteger todas las rutas de la app
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'feed' },
      { path: 'feed',    component: FeedComponent },
      { path: 'search',  component: SearchComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'notifications', component: NotificationsComponent },
      { path: 'review',  component: ReviewComponent },
      { path: 'review/:id',  component: ReviewComponent },
      { path: 'reviews/create', component: ReviewComponent },
    ],
  },
  
  { path: '**', redirectTo: 'login' },
];