import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RootComponent } from './root/root.component';


const routes: Routes = [
  {
    path: '',
    component: RootComponent,
    children: [
      {
        path: 'home',
        loadChildren: () => import('./home/home.module')
          .then(m => m.HomeModule)
      },
      {
        path: 'users',
        loadChildren: () => import('./users/users.module')
          .then(m => m.UsersModule)
      },
      {
        path:'profile',
        loadChildren:()=>import('./profile/profile.module')
        .then(m=>m.ProfileModule)
      },
      {
        path: 'programmes',
        loadChildren: () => import('./programmes/programmes.module')
          .then(m => m.ProgrammesModule)
      },
      {
        path: 'stress-thermometer',
        loadChildren: () => import('./stress-thermometer/stress-thermometer.module')
          .then(m => m.StressThermometerModule)
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'

      }
    ]

  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
