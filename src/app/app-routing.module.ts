import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { UserType } from './models';
import { AuthGuard } from './services/auth.guard';
import { AutoLoginGuard } from './services/auto-login.guard';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.module')
      .then(m => m.AuthModule),
      canLoad:[AutoLoginGuard]
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./pages/dashboard/dashboard.module')
      .then(m => m.DashboardModule),
    data: { allowUserType: [UserType.corporate] },
    canActivate:[AuthGuard],
    canLoad: [AuthGuard]
  },
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
