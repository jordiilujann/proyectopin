import { Routes } from '@angular/router';

import { LoginComponent }   from './components/login/login.component';
import { ShellComponent }   from './components/shell/shell.component';
import { FeedComponent }    from './components/feed/feed.component';
import { SearchComponent }  from './components/search/search.component';
import { ProfileComponent } from './components/profile/profile.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  { path: 'login', component: LoginComponent },

  {
    path: 'app',
    component: ShellComponent,
        children: [
      { path: '', pathMatch: 'full', redirectTo: 'feed' },
      { path: 'feed',    component: FeedComponent },
      { path: 'search',  component: SearchComponent },
      { path: 'profile', component: ProfileComponent },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
