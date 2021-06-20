import { Routes } from '@angular/router';
import { AuthGuard } from '../guards/auth.guard';
import { ProfileViewPageComponent } from './containers/profile-view-page/profile-view-page.component';
import { ProfileEditPageComponent } from './containers/profile-edit-page/profile-edit-page.component';

export const ProfileRoutes: Routes = [
  {
    path: 'profile',
    children: [
      {
        path: '',
        component: ProfileViewPageComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'edit',
        component: ProfileEditPageComponent,
        canActivate: [AuthGuard]
      },
      // {
      //   path: '',
      //   redirectTo: 'view'
      // }
    ]
  }
  ];
